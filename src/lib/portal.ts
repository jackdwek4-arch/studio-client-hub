import { createAdminClient } from "@/lib/supabase/admin";
import type { Client, Document, Invoice, InvoiceItem, Profile, Project } from "@/lib/types";

export type PortalProject = Project & {
  clients: Client | null;
  profiles: Pick<Profile, "business_name" | "tagline" | "website" | "email"> | null;
};

/** Look up a project by its secret portal token. Returns null if the token is wrong. */
export async function getPortalProject(token: string): Promise<PortalProject | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("projects")
    .select("*, clients(*), profiles(business_name, tagline, website, email)")
    .eq("portal_token", token)
    .maybeSingle<PortalProject>();
  return data ?? null;
}

export async function getPortalDocuments(projectId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("documents")
    .select("*")
    .eq("project_id", projectId)
    .neq("status", "draft")
    .order("created_at");
  return (data ?? []) as Document[];
}

export async function getPortalInvoices(projectId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("project_id", projectId)
    .neq("status", "draft")
    .order("created_at");
  return (data ?? []) as (Invoice & { invoice_items: InvoiceItem[] })[];
}
