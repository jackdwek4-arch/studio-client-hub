"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitInquiry(formData: FormData) {
  const slug = String(formData.get("slug"));
  // Honeypot: bots fill every field, humans never see this one.
  if (String(formData.get("company_website_url") ?? "") !== "") redirect(`/book/${slug}?sent=1`);

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("slug", slug).maybeSingle();
  if (!profile) redirect(`/book/${slug}?error=1`);

  const s = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };

  const name = s("name");
  const email = s("email");
  if (!name || !email) redirect(`/book/${slug}?error=1`);

  await admin.from("inquiries").insert({
    owner_id: profile.id,
    name,
    email,
    company: s("company"),
    website: s("website"),
    budget: s("budget"),
    message: s("message"),
  });

  redirect(`/book/${slug}?sent=1`);
}
