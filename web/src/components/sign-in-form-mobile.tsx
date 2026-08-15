"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const inputClass =
  "w-full bg-canvas border border-white/15 px-4 py-3 font-mono text-[0.95rem] text-bone placeholder:text-steel-55 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all";

export function SignInFormMobile() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.hide();
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setError(error.message || "Sign in failed");
      setLoading(false);
      return;
    }
    router.push("/app/console");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          Email
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          readOnly={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          readOnly={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>
      {error && (
        <div className="border border-line bg-panel-30 px-3 py-2 font-mono text-[0.82rem] text-bone-80">
          <span className="text-accent">!</span> {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="group relative inline-flex h-12 w-full items-center justify-center gap-2 bg-accent font-mono text-[0.85rem] uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-accent-dim disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center font-mono text-[0.82rem] text-steel-70">
        New here?{" "}
        <Link
          href="/app/sign-up"
          className="text-bone underline underline-offset-4 hover:text-accent"
        >
          Make an account
        </Link>
      </p>
    </form>
  );
}
