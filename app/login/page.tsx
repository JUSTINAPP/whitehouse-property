"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Login isn't configured in this environment yet.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid login credentials")
          ? "Incorrect email or password."
          : `Sign-in failed: ${signInError.message}`
      );
      return;
    }

    const redirectTo = searchParams.get("redirectTo") || "/";
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15">
            <Lock className="h-5 w-5 text-gold" />
          </span>
          <h1 className="text-lg font-semibold text-ink">Whitehouse Property Group</h1>
          <p className="text-sm text-ink-soft">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              placeholder="you@whpgroup.com.au"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
