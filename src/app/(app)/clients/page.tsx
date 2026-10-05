import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { ButtonLink, Empty, PageHeader } from "@/components/ui";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*, projects(count)")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as (Client & { projects: { count: number }[] })[];

  return (
    <>
      <PageHeader title="Clients" actions={<ButtonLink href="/clients/new">New client</ButtonLink>} />
      {clients.length === 0 ? (
        <Empty>No clients yet.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Company</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Email</th>
                <th className="px-4 py-2.5 text-right font-medium">Projects</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="font-medium hover:text-accent">
                      {c.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-2 sm:table-cell">{c.company ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-ink-2 md:table-cell">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-ink-2">{c.projects?.[0]?.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
