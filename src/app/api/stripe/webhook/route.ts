import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Stripe calls this after checkout. Marks the matching invoice paid.
 *  Stripe dashboard -> Developers -> Webhooks -> endpoint: <APP_URL>/api/stripe/webhook
 *  Event to send: checkout.session.completed */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id;
    if (invoiceId && session.payment_status === "paid") {
      const admin = createAdminClient();
      await admin
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", invoiceId);
    }
  }

  return NextResponse.json({ received: true });
}
