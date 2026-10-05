export type ProjectStage = "lead" | "proposal_sent" | "booked" | "in_progress" | "complete" | "lost";
export type DocumentKind = "proposal" | "contract";
export type DocumentStatus = "draft" | "sent" | "signed" | "declined";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";
export type InquiryStatus = "new" | "converted" | "archived";

export interface Profile {
  id: string;
  email: string | null;
  business_name: string;
  slug: string | null;
  tagline: string | null;
  website: string | null;
}

export interface Client {
  id: string;
  owner_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  client_id: string;
  title: string;
  description: string | null;
  stage: ProjectStage;
  budget_cents: number | null;
  start_date: string | null;
  portal_token: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  owner_id: string;
  project_id: string;
  kind: DocumentKind;
  title: string;
  body: string;
  amount_cents: number | null;
  status: DocumentStatus;
  sent_at: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signer_email: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  owner_id: string;
  project_id: string;
  number: number;
  title: string;
  status: InvoiceStatus;
  due_date: string | null;
  currency: string;
  total_cents: number;
  notes: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_cents: number;
  position: number;
}

export interface Inquiry {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  company: string | null;
  website: string | null;
  budget: string | null;
  message: string | null;
  status: InquiryStatus;
  created_at: string;
}

export const STAGES: { value: ProjectStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "proposal_sent", label: "Proposal sent" },
  { value: "booked", label: "Booked" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
  { value: "lost", label: "Lost" },
];

export function stageLabel(stage: ProjectStage) {
  return STAGES.find((s) => s.value === stage)?.label ?? stage;
}
