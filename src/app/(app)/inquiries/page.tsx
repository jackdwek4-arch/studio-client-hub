import { createClient } from "@/lib/supabase/server";
import { date, appUrl } from "@/lib/format";
import type { Inquiry, Profile } from "@/lib/types";
import { Badge, Button, Card, Empty, PageHeader } from "@/components/ui";
import { archiveInquiry, convertInquiry } from "../actions";

export default async function InquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from("inquiries").select("*").neq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("profiles").select("slug").eq("id", user!.id).single<Pick<Profile, "slug">>(),
  ]);
  const inquiries = (data ?? []) as Inquiry[];
  const formUrl = profile?.slug ? appUrl(`/book/${profile.slug}`) : null;
  const webhookUrl = profile?.slug ? appUrl(`/api/inquiries?slug=${profile.slug}&secret=…`) : null;

  return (
    <>
      <PageHeader
        title="Inquiries"
        subtitle={
          formUrl ? (
            <>
              Your booking form: <a href={formUrl} className="text-accent underline" target="_blank">{formUrl}</a>
              <br />
              Website form webhook: <code className="rounded bg-paper px-1">{webhookUrl}</code> (replace … with your
              INQUIRY_WEBHOOK_SECRET)
            </>
          ) : (
            "Set a booking-form slug in Settings to start receiving inquiries."
          )
        }
      />

      {inquiries.length === 0 ? (
        <Empty>No new inquiries. Share your booking form link to get leads here.</Empty>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{inq.name}</p>
                    <Badge value={inq.status} />
                    {inq.source === "website" && <Badge value="website" />}
                  </div>
                  <p className="text-sm text-ink-2">
                    {inq.email}{inq.company ? ` · ${inq.company}` : ""}{inq.budget ? ` · ${inq.budget}` : ""}
                  </p>
                  {inq.website && <p className="text-sm text-ink-3">{inq.website}</p>}
                  {inq.message && <p className="mt-2 whitespace-pre-wrap text-sm">{inq.message}</p>}
                  <p className="mt-2 text-xs text-ink-3">{date(inq.created_at)}</p>
                </div>
                {inq.status === "new" && (
                  <div className="flex gap-2">
                    <form action={archiveInquiry}>
                      <input type="hidden" name="id" value={inq.id} />
                      <Button variant="ghost" type="submit">Archive</Button>
                    </form>
                    <form action={convertInquiry}>
                      <input type="hidden" name="id" value={inq.id} />
                      <Button type="submit">Convert to project</Button>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
