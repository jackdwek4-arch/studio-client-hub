import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Document, Project } from "@/lib/types";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { createInvoice } from "../../../../actions";

export default async function NewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, title").eq("id", id).single<Pick<Project, "id" | "title">>();
  if (!project) notFound();

  // Suggest a deposit based on the latest proposal
  const { data: proposal } = await supabase
    .from("documents")
    .select("amount_cents")
    .eq("project_id", id)
    .eq("kind", "proposal")
    .not("amount_cents", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<Document, "amount_cents">>();

  const deposit = proposal?.amount_cents ? (proposal.amount_cents / 200).toFixed(2) : "";
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl">
      <PageHeader title="New invoice" subtitle={project.title} />
      <Card>
        <form action={createInvoice} className="space-y-4">
          <input type="hidden" name="project_id" value={project.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><Input name="title" defaultValue="Deposit invoice" required /></Field>
            <Field label="Due date"><Input name="due_date" type="date" defaultValue={in14} /></Field>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-ink-2">Line items</p>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <input name="item_description" placeholder={i === 0 ? "50% deposit — website design & development" : "Description"} defaultValue={i === 0 && deposit ? "50% deposit — website design & development" : ""} className="col-span-7 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                  <input name="item_quantity" placeholder="Qty" defaultValue="1" inputMode="decimal" className="col-span-2 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                  <input name="item_unit" placeholder="Price" defaultValue={i === 0 ? deposit : ""} inputMode="decimal" className="col-span-3 rounded-lg border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-3">Leave rows blank to skip them. Prices in USD.</p>
          </div>

          <Field label="Notes to client"><Textarea name="notes" placeholder="Thanks! Work begins once the deposit clears." /></Field>
          <Button type="submit">Create invoice</Button>
        </form>
      </Card>
    </div>
  );
}
