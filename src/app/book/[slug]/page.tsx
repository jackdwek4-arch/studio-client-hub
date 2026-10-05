import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { submitInquiry } from "./actions";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { sent, error } = await searchParams;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("business_name, tagline, website")
    .eq("slug", slug)
    .maybeSingle<Pick<Profile, "business_name" | "tagline" | "website">>();
  if (!profile) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 md:py-16">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{profile.business_name}</h1>
        {profile.tagline && <p className="mt-1 text-ink-2">{profile.tagline}</p>}
      </header>

      {sent ? (
        <Card>
          <h2 className="font-semibold">Thanks — got it.</h2>
          <p className="mt-1 text-sm text-ink-2">I’ll review your project and get back to you within one business day.</p>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold">Tell me about your project</h2>
          <p className="mb-4 mt-1 text-sm text-ink-2">A few details and I’ll follow up with next steps.</p>
          {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">Please add your name and email.</p>}
          <form action={submitInquiry} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="text" name="company_website_url" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name"><Input name="name" required /></Field>
              <Field label="Email"><Input name="email" type="email" required /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business / company"><Input name="company" /></Field>
              <Field label="Current website (if any)"><Input name="website" placeholder="https://" /></Field>
            </div>
            <Field label="Budget">
              <Select name="budget" defaultValue="">
                <option value="">Not sure yet</option>
                <option>Under $2,000</option>
                <option>$2,000 – $5,000</option>
                <option>$5,000 – $10,000</option>
                <option>$10,000+</option>
              </Select>
            </Field>
            <Field label="What are you looking for?"><Textarea name="message" placeholder="New site, redesign, landing page, e-commerce… and when you’d like it live." /></Field>
            <Button type="submit">Send inquiry</Button>
          </form>
        </Card>
      )}
    </main>
  );
}
