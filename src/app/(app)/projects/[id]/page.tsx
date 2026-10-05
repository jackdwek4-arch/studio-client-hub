import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, date, appUrl } from "@/lib/format";
import { STAGES, stageLabel, type Client, type Document, type Invoice, type Project } from "@/lib/types";
import { Badge, Button, ButtonLink, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { createDocument, updateProject, updateProjectStage } from "../../actions";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(*)")
    .eq("id", id)
    .single<Project & { clients: Client | null }>();
  if (!project) notFound();

  const [{ data: documents }, { data: invoices }] = await Promise.all([
    supabase.from("documents").select("*").eq("project_id", id).order("created_at"),
    supabase.from("invoices").select("*").eq("project_id", id).order("created_at"),
  ]);
  const docs = (documents ?? []) as Document[];
  const invs = (invoices ?? []) as Invoice[];
  const portalUrl = appUrl(`/p/${project.portal_token}`);

  return (
    <>
      <PageHeader
        title={project.title}
        subtitle={
          <>
            <Link href={`/clients/${project.client_id}`} className="hover:text-accent">{project.clients?.name}</Link>
            {project.clients?.email ? ` · ${project.clients.email}` : ""}
          </>
        }
        actions={
          <form action={updateProjectStage} className="flex items-center gap-2">
            <input type="hidden" name="id" value={project.id} />
            <Select name="stage" defaultValue={project.stage}>
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <Button type="submit" variant="secondary">Update</Button>
          </form>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-accent-2/60">
        <div>
          <p className="text-sm font-medium">Client portal link</p>
          <p className="break-all text-xs text-ink-2">{portalUrl}</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={portalUrl} />
          <a href={portalUrl} target="_blank" className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 hover:bg-paper">
            Preview
          </a>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-2">Proposals & contracts</h2>
              <div className="flex gap-2">
                <form action={createDocument}>
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="kind" value="proposal" />
                  <Button type="submit" variant="secondary">+ Proposal</Button>
                </form>
                <form action={createDocument}>
                  <input type="hidden" name="project_id" value={project.id} />
                  <input type="hidden" name="kind" value="contract" />
                  <Button type="submit" variant="secondary">+ Contract</Button>
                </form>
              </div>
            </div>
            <div className="space-y-2">
              {docs.map((d) => (
                <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 hover:border-accent">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-ink-3">
                      {d.kind === "proposal" ? "Proposal" : "Contract"}
                      {d.signed_at ? ` · signed ${date(d.signed_at)} by ${d.signer_name}` : d.sent_at ? ` · sent ${date(d.sent_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {d.amount_cents != null && <span className="text-ink-2">{money(d.amount_cents)}</span>}
                    <Badge value={d.status} />
                  </div>
                </Link>
              ))}
              {docs.length === 0 && <p className="text-sm text-ink-3">Start with a proposal — it comes pre-filled with a template you can edit.</p>}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-2">Invoices</h2>
              <ButtonLink href={`/projects/${project.id}/invoices/new`} variant="secondary">+ Invoice</ButtonLink>
            </div>
            <div className="space-y-2">
              {invs.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between rounded-xl border border-line bg-surface p-4 hover:border-accent">
                  <div>
                    <p className="font-medium">#{String(inv.number).padStart(4, "0")} · {inv.title}</p>
                    <p className="text-xs text-ink-3">Due {date(inv.due_date)}{inv.paid_at ? ` · paid ${date(inv.paid_at)}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{money(inv.total_cents, inv.currency)}</span>
                    <Badge value={inv.status} />
                  </div>
                </Link>
              ))}
              {invs.length === 0 && <p className="text-sm text-ink-3">No invoices yet.</p>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-semibold">Project details</h2>
            <form action={updateProject} className="space-y-3">
              <input type="hidden" name="id" value={project.id} />
              <Field label="Title"><Input name="title" defaultValue={project.title} required /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Budget (USD)">
                  <Input name="budget" inputMode="decimal" defaultValue={project.budget_cents != null ? (project.budget_cents / 100).toFixed(2) : ""} />
                </Field>
                <Field label="Start date"><Input name="start_date" type="date" defaultValue={project.start_date ?? ""} /></Field>
              </div>
              <Field label="Description"><Textarea name="description" defaultValue={project.description ?? ""} /></Field>
              <Button type="submit" variant="secondary">Save</Button>
            </form>
            <p className="mt-4 text-xs text-ink-3">
              Stage: <Badge value={project.stage} label={stageLabel(project.stage)} /> · created {date(project.created_at)}
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
