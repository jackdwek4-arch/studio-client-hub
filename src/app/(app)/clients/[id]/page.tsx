import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, date } from "@/lib/format";
import { STAGES, stageLabel, type Client, type Project } from "@/lib/types";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { createProject, updateClientRecord } from "../../actions";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single<Client>(),
    supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);
  if (!client) notFound();

  return (
    <>
      <PageHeader title={client.name} subtitle={client.company ?? undefined} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-2">Projects</h2>
            <div className="space-y-2">
              {(projects as Project[] | null)?.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 hover:border-accent"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-ink-3">Started {date(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {p.budget_cents != null && <span className="text-ink-2">{money(p.budget_cents)}</span>}
                    <Badge value={p.stage} label={stageLabel(p.stage)} />
                  </div>
                </Link>
              ))}
              {(!projects || projects.length === 0) && (
                <p className="text-sm text-ink-3">No projects yet — create one on the right.</p>
              )}
            </div>
          </section>

          <Card>
            <h2 className="mb-3 font-semibold">Client details</h2>
            <form action={updateClientRecord} className="space-y-3">
              <input type="hidden" name="id" value={client.id} />
              <Field label="Name"><Input name="name" defaultValue={client.name} required /></Field>
              <Field label="Company"><Input name="company" defaultValue={client.company ?? ""} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email"><Input name="email" type="email" defaultValue={client.email ?? ""} /></Field>
                <Field label="Phone"><Input name="phone" defaultValue={client.phone ?? ""} /></Field>
              </div>
              <Field label="Notes"><Textarea name="notes" defaultValue={client.notes ?? ""} /></Field>
              <Button type="submit" variant="secondary">Save changes</Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-semibold">New project</h2>
            <form action={createProject} className="space-y-3">
              <input type="hidden" name="client_id" value={client.id} />
              <Field label="Project title"><Input name="title" placeholder="e.g. Brand site redesign" required /></Field>
              <Field label="Stage">
                <Select name="stage" defaultValue="lead">
                  {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Budget (USD)"><Input name="budget" inputMode="decimal" placeholder="4,500" /></Field>
                <Field label="Start date"><Input name="start_date" type="date" /></Field>
              </div>
              <Field label="Description"><Textarea name="description" placeholder="What are we building?" /></Field>
              <Button type="submit">Create project</Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
