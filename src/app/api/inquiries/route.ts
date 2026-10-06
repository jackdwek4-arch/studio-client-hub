import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Receives leads from an external website form (Elementor "Webhook" action
 *  on the 100xweb WordPress site) and stores them as inquiries.
 *
 *  URL: <APP_URL>/api/inquiries?slug=<booking-form slug>&secret=<INQUIRY_WEBHOOK_SECRET>
 *  Body: JSON or form-encoded, with fields named name, email, company, website, budget, message.
 *  Only name and email are required. Elementor sends `fields` keyed by field ID. */

const FIELDS = ["name", "email", "company", "website", "budget", "message"] as const;

function secretMatches(given: string | null, expected: string | undefined) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Flatten the body into a lowercase key -> string map.
 *  Elementor's default payload is form-encoded with keys like `fields[email][value]`;
 *  with "Advanced Data" on it is JSON `{ fields: { email: { value } } }`. Both are handled. */
async function readFields(request: Request): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const put = (key: string, value: unknown) => {
    const k = key.toLowerCase().replace(/^fields\[([^\]]+)\](\[value\])?$/, "$1");
    if (typeof value === "string") out[k] = value.trim();
    else if (value && typeof value === "object" && "value" in value && typeof (value as { value: unknown }).value === "string") {
      out[k] = ((value as { value: string }).value ?? "").trim();
    }
  };

  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const fields = (body.fields && typeof body.fields === "object" ? body.fields : body) as Record<string, unknown>;
    for (const [k, v] of Object.entries(fields)) put(k, v);
  } else {
    const form = await request.formData().catch(() => null);
    if (form) for (const [k, v] of form.entries()) put(k, v);
  }
  return out;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!secretMatches(url.searchParams.get("secret"), process.env.INQUIRY_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const fields = await readFields(request);
  const get = (k: (typeof FIELDS)[number]) => (fields[k] ? fields[k] : null);
  const name = get("name");
  const email = get("email");
  if (!name || !email) return NextResponse.json({ error: "name and email are required" }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("id").eq("slug", slug).maybeSingle();
    if (!profile) return NextResponse.json({ error: "Unknown slug" }, { status: 404 });

    const { error } = await admin.from("inquiries").insert({
      owner_id: profile.id,
      name,
      email,
      company: get("company"),
      website: get("website"),
      budget: get("budget"),
      message: get("message"),
      source: "website",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: `Database unavailable: ${(err as Error).message}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
