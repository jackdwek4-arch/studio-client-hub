import { Button, Field, Input, Card } from "@/components/ui";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
}) {
  const { error, notice, next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
            C
          </div>
          <h1 className="text-xl font-semibold">Client Hub</h1>
          <p className="mt-1 text-sm text-ink-2">Sign in to manage your studio.</p>
        </div>

        <Card>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
          )}
          {notice === "check-email" && (
            <p className="mb-4 rounded-lg bg-accent-2 px-3 py-2 text-sm text-accent">
              Check your email to confirm your account, then sign in.
            </p>
          )}

          <form className="space-y-4">
            <input type="hidden" name="next" value={next ?? "/dashboard"} />
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" required minLength={6} autoComplete="current-password" />
            </Field>
            <div className="flex gap-2 pt-1">
              <Button formAction={signIn} className="flex-1">
                Sign in
              </Button>
              <Button formAction={signUp} variant="secondary" className="flex-1">
                Create account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
