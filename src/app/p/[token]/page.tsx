import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalDocuments, getPortalInvoices, getPortalProject } from "@/lib/portal";
import { money, date } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export default async function PortalHome({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await getPortalProject(token);
  if (!project) notFound();

  const [docs, invoices] = await Promise.all([getPortalDocuments(project.id), getPortalInvoices(project.id)]);
  const todo = docs.filter((d) => d.status === "sent").length + invoices.filter((i) => i.status === "sent").length;

  return (
    <>
      <header className="mb-8">
        <p className="text-sm text-ink-2">{project.profiles?.business_name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="mt-1 text-sm text-ink-2">
          Hi {project.clients?.name?.split(" ")[0]} — everything for your project lives here.
          {todo > 0 && <span className="ml-1 font-medium text-warn">{todo} item{todo > 1 ? "s" : ""} need your attention.</span>}
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-2">Documents</h2>
        {docs.length === 0 ? (
          <Card className="text-sm text-ink-3">Nothing to review yet.</Card>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <Link key={d.id} href={`/p/${token}/doc/${d.id}`} className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 hover:border-accent">
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-ink-3">{d.signed_at ? `Signed ${date(d.signed_at)}` : d.status === "sent" ? "Awaiting your signature" : d.status}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {d.amount_cents != null && <span className="text-ink-2">{money(d.amount_cents)}</span>}
                  <Badge value={d.status} label={d.status === "sent" ? "to sign" : undefined} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-2">Invoices</h2>
        {invoices.length === 0 ? (
          <Card className="text-sm text-ink-3">No invoices yet.</Card>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <Link key={inv.id} href={`/p/${token}/invoice/${inv.id}`} className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 hover:border-accent">
                <div>
                  <p className="font-medium">{inv.title}</p>
                  <p className="text-xs text-ink-3">{inv.paid_at ? `Paid ${date(inv.paid_at)}` : `Due ${date(inv.due_date)}`}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">{money(inv.total_cents, inv.currency)}</span>
                  <Badge value={inv.status} label={inv.status === "sent" ? "to pay" : undefined} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-12 text-center text-xs text-ink-3">
        Questions? Email <a href={`mailto:${project.profiles?.email}`} className="underline">{project.profiles?.email}</a>
      </footer>
    </>
  );
}
