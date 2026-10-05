import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { STAGES, type Project } from "@/lib/types";
import { ButtonLink, Card, Empty, PageHeader } from "@/components/ui";

type Row = Project & { clients: { name: string } | null };

export default async function Dashboard() {
  const supabase = await createClient();

  const [{ data: projects }, { data: openInvoices }, { count: newInquiries }] = await Promise.all([
    supabase.from("projects").select("*, clients(name)").order("updated_at", { ascending: false }),
    supabase.from("invoices").select("total_cents").eq("status", "sent"),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const rows = (projects ?? []) as Row[];
  const outstanding = ((openInvoices ?? []) as { total_cents: number }[]).reduce((s, i) => s + i.total_cents, 0);
  const active = rows.filter((p) => ["booked", "in_progress"].includes(p.stage)).length;
  const leads = rows.filter((p) => ["lead", "proposal_sent"].includes(p.stage)).length;

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Every project, from first inquiry to launch."
        actions={<ButtonLink href="/clients/new">New client</ButtonLink>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open leads" value={String(leads)} />
        <Stat label="Active projects" value={String(active)} />
        <Stat label="Awaiting payment" value={money(outstanding)} />
        <Stat label="New inquiries" value={String(newInquiries ?? 0)} href="/inquiries" />
      </div>

      {rows.length === 0 ? (
        <Empty>
          No projects yet. <Link href="/clients/new" className="text-accent underline">Add a client</Link> to start one,
          or share your <Link href="/settings" className="text-accent underline">booking form</Link>.
        </Empty>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.filter((s) => s.value !== "lost").map((stage) => {
            const col = rows.filter((p) => p.stage === stage.value);
            return (
              <div key={stage.value} className="w-60 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-2">{stage.label}</span>
                  <span className="text-xs text-ink-3">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block rounded-xl border border-line bg-surface p-3 transition hover:border-accent"
                    >
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="mt-0.5 text-xs text-ink-2">{p.clients?.name}</p>
                      {p.budget_cents != null && (
                        <p className="mt-2 text-xs text-ink-3">{money(p.budget_cents)}</p>
                      )}
                    </Link>
                  ))}
                  {col.length === 0 && <div className="rounded-xl border border-dashed border-line p-3" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <Card className="p-4">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
