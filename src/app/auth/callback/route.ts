import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Handles the link in Supabase's confirmation email. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/settings`);
  }
  return NextResponse.redirect(`${origin}/login?error=Could+not+confirm+email`);
}
