import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { money, date, appUrl } from "@/lib/format";
import type { Document, Project } from "@/lib/types";
import { Badge, Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { CopyButton } from "@/components/copy-button";
import { deleteDocument, sendDocument, updateDocument } from "../../actions";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("*, projects(id, title, portal_token)")
    .eq("id", id)
    .single<Document & { projects: Pick<Project, "id" | "title" | "portal_token"> | null }>();
  if (!doc) notFound();

  const locked = doc.status === "signed";
  const portalUrl = appUrl(`/p/${doc.projects?.portal_token}/doc/${doc.id}`);

  return (
    <>
      <PageHeader
        title={doc.title}
        subtitle={
          <>
            {doc.kind === "proposal" ? "Proposal" : "Contract"} for{" "}
            <Link href={`/projects/${doc.project_id}`} className="hover:text-accent">{doc.projects?.title}</Link>{" "}
            · <Badge value={doc.status} />
          </>
        }
        actions={
          <>
            <CopyButton text={portalUrl} label="Copy signing link" />
            {doc.status === "draft" && (
              <form action={sendDocument}>
                <input type="hidden" name="id" value={doc.id} />
                <Button type="submit">Mark as sent</Button>
              </form>
            )}
          </>
        }
      />

      {doc.status === "signed" && (
        <Card className="mb-6 bg-accent-2/60">
          <p className="text-sm font-medium text-accent">
            Signed by {doc.signer_name} ({doc.signer_email}) on {date(doc.signed_at)}.
          </p>
          <p className="mt-1 text-xs text-ink-2">Signed documents are locked. Create a new one to make changes.</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">{locked ? "Document" : "Edit"}</h2>
          {locked ? (
            <Markdown text={doc.body} />
          ) : (
            <form action={updateDocument} className="space-y-3">
              <input type="hidden" name="id" value={doc.id} />
              <Field label="Title"><Input name="title" defaultValue={doc.title} required /></Field>
              {doc.kind === "proposal" && (
                <Field label="Total (USD)" hint="Shown to the client as the proposal total.">
                  <Input name="amount" inputMode="decimal" defaultValue={doc.amount_cents != null ? (doc.amount_cents / 100).toFixed(2) : ""} />
                </Field>
              )}
              <Field label="Body" hint="Markdown: ## headings, - lists, **bold**.">
                <textarea name="body" defaultValue={doc.body} rows={26} className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </Field>
              <div className="flex items-center justify-between">
                <Button type="submit">Save</Button>
              </div>
            </form>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-semibold">Client preview</h2>
            {doc.amount_cents != null && (
              <p className="mb-3 rounded-lg bg-paper px-3 py-2 text-sm">Total: <strong>{money(doc.amount_cents)}</strong></p>
            )}
            <Markdown text={doc.body} />
          </Card>
          {!locked && (
            <form action={deleteDocument}>
              <input type="hidden" name="id" value={doc.id} />
              <input type="hidden" name="project_id" value={doc.project_id} />
              <Button type="submit" variant="danger">Delete document</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
