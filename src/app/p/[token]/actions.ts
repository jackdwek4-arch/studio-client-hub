"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPortalProject } from "@/lib/portal";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/format";

/** Client signs a proposal or contract with a typed signature. */
export async function signDocument(formData: FormData) {
  const token = String(formData.get("token"));
  const docId = String(formData.get("doc_id"));
  const name = String(formData.get("signer_name") ?? "").trim();
  const email = String(formData.get("signer_email") ?? "").trim();
  const agreed = formData.get("agree") === "on";

  const project = await getPortalProject(token);
  if (!project || !name || !email || !agreed) {
    redirect(`/p/${token}/doc/${docId}?error=1`);
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signer_name: name,
      signer_email: email,
      signer_ip: ip,
    })
    .eq("id", docId)
    .eq("project_id", project.id)
    .eq("status", "sent")
    .select("kind")
    .maybeSingle();

  // Signing a proposal or contract moves the project to "booked"
  if (doc && ["lead", "proposal_sent"].includes(project.stage)) {
    await admin.from("projects").update({ stage: "booked" }).eq("id", project.id);
  }

  redirect(`/p/${token}/doc/${docId}?signed=1`);
}

/** Client pays an invoice: create a Stripe Checkout session and send them there. */
export async function payInvoice(formData: FormData) {
  const token = String(formData.get("token"));
  const invoiceId = String(formData.get("invoice_id"));

  const project = await getPortalProject(token);
  if (!project) redirect(`/p/${token}`);

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", invoiceId)
    .eq("project_id", project.id)
    .eq("status", "sent")
    .maybeSingle();
  if (!inv) redirect(`/p/${token}/invoice/${invoiceId}`);

  const items = (inv.invoice_items as { description: string; quantity: number; unit_cents: number }[]) ?? [];
  const lineItems = items.length
    ? items.map((it) => ({
        price_data: {
          currency: inv.currency,
          product_data: { name: it.description },
          unit_amount: Math.round(it.unit_cents * Number(it.quantity)),
        },
        quantity: 1,
      }))
    : [
        {
          price_data: { currency: inv.currency, product_data: { name: inv.title }, unit_amount: inv.total_cents },
          quantity: 1,
        },
      ];

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: project.clients?.email ?? undefined,
    metadata: { invoice_id: inv.id, project_id: project.id },
    success_url: appUrl(`/p/${token}/invoice/${inv.id}?paid=1`),
    cancel_url: appUrl(`/p/${token}/invoice/${inv.id}`),
  });

  await admin.from("invoices").update({ stripe_checkout_session_id: session.id }).eq("id", inv.id);
  redirect(session.url!);
}
