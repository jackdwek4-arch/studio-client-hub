import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Pipeline" },
  { href: "/clients", label: "Clients" },
  { href: "/inquiries", label: "Inquiries" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { count: newInquiries } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 md:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            {(profile?.business_name ?? "C").charAt(0).toUpperCase()}
          </span>
          <span className="truncate text-sm font-semibold">{profile?.business_name ?? "Client Hub"}</span>
        </Link>
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-paper hover:text-ink"
            >
              {item.label}
              {item.href === "/inquiries" && (newInquiries ?? 0) > 0 && (
                <span className="rounded-full bg-warn-2 px-2 text-xs font-medium text-warn">
                  {newInquiries}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-6">
          <p className="truncate text-xs text-ink-3">{user.email}</p>
          <form action="/auth/signout" method="post">
            <button className="mt-1 text-xs text-ink-2 hover:text-ink">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-ink-2 hover:bg-paper"
            >
              {item.label}
            </Link>
          ))}
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
