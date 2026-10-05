import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { updateProfile } from "../actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();

  return (
    <div className="max-w-lg">
      <PageHeader title="Settings" subtitle="How your studio appears to clients." />
      <Card>
        {saved && <p className="mb-4 rounded-lg bg-accent-2 px-3 py-2 text-sm text-accent">Saved.</p>}
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}
        <form action={updateProfile} className="space-y-4">
          <Field label="Business name">
            <Input name="business_name" defaultValue={profile?.business_name ?? ""} required />
          </Field>
          <Field label="Tagline" hint="Shown on your booking form and client portal.">
            <Input name="tagline" defaultValue={profile?.tagline ?? ""} placeholder="Websites for small businesses that want to look big." />
          </Field>
          <Field label="Website">
            <Input name="website" defaultValue={profile?.website ?? ""} placeholder="https://" />
          </Field>
          <Field
            label="Booking form slug"
            hint={`Your public form lives at ${appUrl("/book/")}<slug>`}
          >
            <Input name="slug" defaultValue={profile?.slug ?? ""} placeholder="your-studio" />
          </Field>
          <Button type="submit">Save</Button>
        </form>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">Payments</h2>
        <p className="mt-1 text-sm text-ink-2">
          Card payments run through Stripe. Set <code className="rounded bg-paper px-1">STRIPE_SECRET_KEY</code> and{" "}
          <code className="rounded bg-paper px-1">STRIPE_WEBHOOK_SECRET</code> in your hosting environment and the
          “Pay now” button appears on client invoices automatically.
        </p>
      </Card>
    </div>
  );
}
