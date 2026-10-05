import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-ink-2">That link may have expired or been typed incorrectly.</p>
      <Link href="/" className="mt-2 text-sm text-accent underline">Go home</Link>
    </main>
  );
}
