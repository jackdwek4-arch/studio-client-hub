"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toCents } from "@/lib/format";
import { CONTRACT_TEMPLATE, PROPOSAL_TEMPLATE, fillTemplate } from "@/lib/templates";
import type { DocumentKind, ProjectStage } from "@/lib/types";

async function owner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  const s = v === null ? "" : String(v).trim();
  return s === "" ? null : s;
};

// ---------------- profile ----------------

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await owner();
  const slug = (str(formData, "slug") ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { error } = await supabase
    .from("profiles")
    .update({
      business_name: str(formData, "business_name") ?? "My Studio",
      slug: slug || null,
      tagline: str(formData, "tagline"),
      website: str(formData, "website"),
    })
    .eq("id", userId);

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

// ---------------- clients ----------------

export async function createClientRecord(formData: FormData) {
  const { supabase, userId } = await owner();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      owner_id: userId,
      name: str(formData, "name") ?? "Unnamed",
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      company: str(formData, "company"),
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("clients")
    .update({
      name: str(formData, "name") ?? "Unnamed",
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      company: str(formData, "company"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}

// ---------------- projects ----------------

export async function createProject(formData: FormData) {
  const { supabase, userId } = await owner();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      client_id: String(formData.get("client_id")),
      title: str(formData, "title") ?? "New project",
      description: str(formData, "description"),
      budget_cents: toCents(formData.get("budget")),
      start_date: str(formData, "start_date"),
      stage: (str(formData, "stage") as ProjectStage) ?? "lead",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

export async function updateProjectStage(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage")) as ProjectStage;
  const { error } = await supabase.from("projects").update({ stage }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${id}`);
}

export async function updateProject(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("projects")
    .update({
      title: str(formData, "title") ?? "Untitled",
      description: str(formData, "description"),
      budget_cents: toCents(formData.get("budget")),
      start_date: str(formData, "start_date"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
}

// ---------------- documents (proposals + contracts) ----------------

export async function createDocument(formData: FormData) {
  const { supabase, userId } = await owner();
  const projectId = String(formData.get("project_id"));
  const kind = String(formData.get("kind")) as DocumentKind;

  const { data: project } = await supabase
    .from("projects")
    .select("title, clients(name)")
    .eq("id", projectId)
    .single();
  const { data: profile } = await supabase.from("profiles").select("business_name").eq("id", userId).single();

  const clientRel = project?.clients as unknown as { name: string } | { name: string }[] | null;
  const clientName = Array.isArray(clientRel) ? clientRel[0]?.name : clientRel?.name;

  const body = fillTemplate(kind === "proposal" ? PROPOSAL_TEMPLATE : CONTRACT_TEMPLATE, {
    client: clientName ?? "Client",
    project: project?.title ?? "the project",
    business: profile?.business_name ?? "the Designer",
  });

  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: userId,
      project_id: projectId,
      kind,
      title: kind === "proposal" ? `Proposal — ${project?.title ?? ""}` : `Agreement — ${project?.title ?? ""}`,
      body,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/documents/${data.id}`);
}

export async function updateDocument(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const { data, error } = await supabase
    .from("documents")
    .update({
      title: str(formData, "title") ?? "Untitled",
      body: String(formData.get("body") ?? ""),
      amount_cents: toCents(formData.get("amount")),
    })
    .eq("id", id)
    .select("project_id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/documents/${id}`);
  revalidatePath(`/projects/${data.project_id}`);
}

export async function sendDocument(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const { data, error } = await supabase
    .from("documents")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id)
    .select("project_id, kind")
    .single();
  if (error) throw new Error(error.message);

  if (data.kind === "proposal") {
    await supabase.from("projects").update({ stage: "proposal_sent" }).eq("id", data.project_id).eq("stage", "lead");
  }
  revalidatePath(`/documents/${id}`);
  revalidatePath(`/projects/${data.project_id}`);
  revalidatePath("/dashboard");
}

export async function deleteDocument(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const projectId = String(formData.get("project_id"));
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

// ---------------- invoices ----------------

export async function createInvoice(formData: FormData) {
  const { supabase, userId } = await owner();
  const projectId = String(formData.get("project_id"));

  const descriptions = formData.getAll("item_description").map(String);
  const quantities = formData.getAll("item_quantity").map((q) => parseFloat(String(q)) || 1);
  const units = formData.getAll("item_unit").map((u) => toCents(u) ?? 0);

  const items = descriptions
    .map((description, i) => ({ description: description.trim(), quantity: quantities[i] ?? 1, unit_cents: units[i] ?? 0, position: i }))
    .filter((it) => it.description !== "");

  const total = items.reduce((sum, it) => sum + Math.round(it.quantity * it.unit_cents), 0);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      owner_id: userId,
      project_id: projectId,
      title: str(formData, "title") ?? "Invoice",
      due_date: str(formData, "due_date"),
      notes: str(formData, "notes"),
      total_cents: total,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (items.length) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(items.map((it) => ({ ...it, invoice_id: invoice.id })));
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/invoices/${invoice.id}`);
}

export async function setInvoiceStatus(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const patch: Record<string, unknown> = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();

  const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select("project_id").single();
  if (error) throw new Error(error.message);
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath(`/projects/${data.project_id}`);
}

// ---------------- inquiries ----------------

export async function convertInquiry(formData: FormData) {
  const { supabase, userId } = await owner();
  const id = String(formData.get("id"));

  const { data: inq } = await supabase.from("inquiries").select("*").eq("id", id).single();
  if (!inq) return;

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ owner_id: userId, name: inq.name, email: inq.email, company: inq.company, notes: inq.message })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: project } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      client_id: client.id,
      title: inq.company ? `${inq.company} website` : `${inq.name} website`,
      description: [inq.website && `Current site: ${inq.website}`, inq.budget && `Budget: ${inq.budget}`, inq.message]
        .filter(Boolean)
        .join("\n\n"),
      stage: "lead",
    })
    .select("id")
    .single();

  await supabase.from("inquiries").update({ status: "converted" }).eq("id", id);
  revalidatePath("/inquiries");
  revalidatePath("/dashboard");
  redirect(project ? `/projects/${project.id}` : "/dashboard");
}

export async function archiveInquiry(formData: FormData) {
  const { supabase } = await owner();
  const id = String(formData.get("id"));
  await supabase.from("inquiries").update({ status: "archived" }).eq("id", id);
  revalidatePath("/inquiries");
}
