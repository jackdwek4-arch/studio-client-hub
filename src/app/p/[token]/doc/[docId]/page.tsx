import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortalProject } from "@/lib/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import { money, date } from "@/lib/format";
import type { Document } from "@/lib/types";
import { Button, Card, Field, Input } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { signDocument } from "../../actions";

export default async function PortalDocument({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; docId: string }>;
  searchParams: Promise<{ signed?: string; error?: string }>;
}) {
  const { token, docId } = await params;
  const { signed, error } = await searchParams;
  const project = await getPortalProject(token);
  if (!project) notFound();

  const admin = createAdminClient();
  const { data: doc } = await admin
    .from("documents")
    .select("*")
    .eq("id", docId)
    .eq("project_id", project.id)
    .neq("status", "draft")
    .maybeSingle<Document>();
  if (!doc) notFound();

  return (
    <>
      <Link href={`/p/${token}`} className="text-sm text-ink-2 hover:text-ink">← Back to {project.title}</Link>
      <header className="mb-6 mt-3">
        <p className="text-sm text-ink-2">{project.profiles?.business_name} · {doc.kind === "proposal" ? "Proposal" : "Agreement"}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{doc.title}</h1>
      </header>

      {signed && (
        <Card className="mb-6 bg-accent-2/60 text-sm text-accent">Thank you — your signature has been recorded.</Card>
      )}
      {error && (
        <Card className="mb-6 bg-red-50 text-sm text-danger">Please enter your name and email and tick the box to sign.</Card>
      )}

      <Card className="mb-6">
        {doc.amount_cents != null && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-paper px-4 py-3">
            <span className="text-sm text-ink-2">Total investment</span>
            <span className="text-lg font-semibold">{money(doc.amount_cents)}</span>
          </div>
        )}
        <Markdown text={doc.body} />
      </Card>

      {doc.status === "signed" ? (
        <Card>
          <p className="text-sm">
            Signed by <strong>{doc.signer_name}</strong> ({doc.signer_email}) on {date(doc.signed_at)}.
          </p>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold">{doc.kind === "proposal" ? "Accept this proposal" : "Sign this agreement"}</h2>
          <p className="mt-1 text-sm text-ink-2">Type your full name below. Your typed name, email, timestamp and IP address are recorded as your electronic signature.</p>
          <form action={signDocument} className="mt-4 space-y-3">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="doc_id" value={doc.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name"><Input name="signer_name" defaultValue={project.clients?.name ?? ""} required /></Field>
              <Field label="Email"><Input name="signer_email" type="email" defaultValue={project.clients?.email ?? ""} required /></Field>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="agree" required className="mt-1" />
              <span>I have read this {doc.kind === "proposal" ? "proposal" : "agreement"} and agree to its terms.</span>
            </label>
            <Button type="submit">{doc.kind === "proposal" ? "Accept proposal" : "Sign agreement"}</Button>
          </form>
        </Card>
      )}
    </>
  );
}
