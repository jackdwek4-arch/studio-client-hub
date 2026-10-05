import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, date, appUrl } from "@/lib/format";
import type { Invoice, InvoiceItem, Project } from "@/lib/types";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { setInvoiceStatus } from "../../actions";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("invoices")
    .select("*, projects(id, title, portal_token, clients(name, email)), invoice_items(*)")
    .eq("id", id)
    .single<Invoice & { projects: (Pick<Project, "id" | "title" | "portal_token"> & { clients: { name: string; email: string | null } | null }) | null; invoice_items: InvoiceItem[] }>();
  if (!inv) notFound();

  const items = [...inv.invoice_items].sort((a, b) => a.position - b.position);
  const payUrl = appUrl(`/p/${inv.projects?.portal_token}/invoice/${inv.id}`);

  return (
    <>
      <PageHeader
        title={`Invoice #${String(inv.number).padStart(4, "0")}`}
        subtitle={
          <>
            {inv.title} · <Link href={`/projects/${inv.project_id}`} className="hover:text-accent">{inv.projects?.title}</Link> · <Badge value={inv.status} />
          </>
        }
        actions={
          <>
            <CopyButton text={payUrl} label="Copy payment link" />
            {inv.status === "draft" && (
              <form action={setInvoiceStatus}>
                <input type="hidden" name="id" value={inv.id} />
                <input type="hidden" name="status" value="sent" />
                <Button type="submit">Mark as sent</Button>
              </form>
            )}
            {inv.status === "sent" && (
              <form action={setInvoiceStatus}>
                <input type="hidden" name="id" value={inv.id} />
                <input type="hidden" name="status" value="paid" />
                <Button type="submit" variant="secondary">Mark paid manually</Button>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex justify-between text-sm">
            <div>
              <p className="text-ink-2">Billed to</p>
              <p className="font-medium">{inv.projects?.clients?.name}</p>
              <p className="text-ink-3">{inv.projects?.clients?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-ink-2">Due</p>
              <p className="font-medium">{date(inv.due_date)}</p>
              {inv.paid_at && <p className="text-xs text-accent">Paid {date(inv.paid_at)}</p>}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-2">
              <tr><th className="py-2 font-medium">Item</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Price</th><th className="py-2 text-right font-medium">Amount</th></tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-line">
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right text-ink-2">{it.quantity}</td>
                  <td className="py-2 text-right text-ink-2">{money(it.unit_cents, inv.currency)}</td>
                  <td className="py-2 text-right">{money(Math.round(it.quantity * it.unit_cents), inv.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line"><td colSpan={3} className="py-3 text-right font-medium">Total</td><td className="py-3 text-right text-base font-semibold">{money(inv.total_cents, inv.currency)}</td></tr>
            </tfoot>
          </table>
          {inv.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-ink-2">{inv.notes}</p>}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold">Client payment link</h2>
            <p className="mt-1 break-all text-xs text-ink-2">{payUrl}</p>
            <p className="mt-2 text-xs text-ink-3">The client opens this, clicks “Pay now” and pays by card through Stripe. The invoice flips to paid automatically.</p>
          </Card>
          {inv.status !== "paid" && inv.status !== "void" && (
            <form action={setInvoiceStatus}>
              <input type="hidden" name="id" value={inv.id} />
              <input type="hidden" name="status" value="void" />
              <Button type="submit" variant="danger">Void invoice</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
