import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalProject } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { money, date } from "@/lib/format";
import type { Invoice, InvoiceItem } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { payInvoice } from "../../actions";

export default async function PortalInvoice({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; invoiceId: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { token, invoiceId } = await params;
  const { paid } = await searchParams;
  const project = await getPortalProject(token);
  if (!project) notFound();

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", invoiceId)
    .eq("project_id", project.id)
    .neq("status", "draft")
    .maybeSingle<Invoice & { invoice_items: InvoiceItem[] }>();
  if (!inv) notFound();

  const items = [...inv.invoice_items].sort((a, b) => a.position - b.position);
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);
  const isPaid = inv.status === "paid";

  return (
    <>
      <Link href={`/p/${token}`} className="text-sm text-ink-2 hover:text-ink">← Back to {project.title}</Link>
      <header className="mb-6 mt-3">
        <p className="text-sm text-ink-2">{project.profiles?.business_name} · Invoice #{String(inv.number).padStart(4, "0")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{inv.title}</h1>
      </header>

      {paid && !isPaid && (
        <Card className="mb-6 bg-accent-2/60 text-sm text-accent">Payment received — this page will update shortly.</Card>
      )}
      {isPaid && (
        <Card className="mb-6 bg-accent-2/60 text-sm text-accent">Paid {date(inv.paid_at)}. Thank you!</Card>
      )}

      <Card className="mb-6">
        <table className="w-full text-sm">
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-line last:border-0">
                <td className="py-2">{it.description}{Number(it.quantity) !== 1 ? <span className="text-ink-3"> × {it.quantity}</span> : null}</td>
                <td className="py-2 text-right">{money(Math.round(it.quantity * it.unit_cents), inv.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td className="pt-3 font-medium">Total due {inv.due_date ? date(inv.due_date) : ""}</td><td className="pt-3 text-right text-xl font-semibold">{money(inv.total_cents, inv.currency)}</td></tr>
          </tfoot>
        </table>
        {inv.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-ink-2">{inv.notes}</p>}
      </Card>

      {!isPaid && inv.status === "sent" && (
        <Card>
          {stripeReady ? (
            <form action={payInvoice} className="flex flex-wrap items-center justify-between gap-3">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="invoice_id" value={inv.id} />
              <p className="text-sm text-ink-2">Pay securely by card. You’ll receive a receipt by email.</p>
              <Button type="submit">Pay {money(inv.total_cents, inv.currency)}</Button>
            </form>
          ) : (
            <p className="text-sm text-ink-2">Online payments aren’t set up yet — please contact {project.profiles?.email} to arrange payment.</p>
          )}
        </Card>
      )}
    </>
  );
}
