import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money, date } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import { Badge, Empty, PageHeader } from "@/components/ui";

type Row = Invoice & { projects: { title: string; clients: { name: string } | null } | null };

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, projects(title, clients(name))")
    .order("created_at", { ascending: false });
  const invoices = (data ?? []) as Row[];

  const outstanding = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.total_cents, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total_cents, 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${money(outstanding)} outstanding · ${money(paid)} collected`}
      />
      {invoices.length === 0 ? (
        <Empty>No invoices yet. Create one from a project page.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Project</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Due</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-line hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium hover:text-accent">
                      {String(inv.number).padStart(4, "0")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{inv.projects?.title}</p>
                    <p className="text-xs text-ink-3">{inv.projects?.clients?.name}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-2 sm:table-cell">{date(inv.due_date)}</td>
                  <td className="px-4 py-3"><Badge value={inv.status} /></td>
                  <td className="px-4 py-3 text-right font-medium">{money(inv.total_cents, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
