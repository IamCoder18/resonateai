"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2, ArrowRight } from "lucide-react";

function isEmailTakenMessage(msg: string | undefined | null): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes("already exists") ||
    m.includes("user already") ||
    m.includes("email already") ||
    m.includes("already registered") ||
    m.includes("user_already_exists") ||
    m.includes("email_taken")
  );
}

const inputClass =
  "w-full bg-canvas border border-white/15 px-4 py-2.5 font-mono text-[0.92rem] text-bone placeholder:text-steel-55 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestLogin, setSuggestLogin] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestLogin(false);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });
    if (error) {
      if (isEmailTakenMessage(error.message)) {
        setError(
          "Looks like you already have an account with this email — try logging in instead.",
        );
        setSuggestLogin(true);
      } else {
        setError(error.message || "Sign up failed");
      }
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          Name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="mb-2 block font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          Email
        </label>
        <input
          type="email"
          required
          autoComplete="email"
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
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </div>
      {error && (
        <div className="border border-line bg-panel-30 px-3 py-2 font-mono text-[0.82rem] text-bone-80">
          <span className="text-accent">!</span> {error}
          {suggestLogin && (
            <div className="mt-2">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1 text-bone underline underline-offset-4 hover:text-accent"
              >
                Log in instead
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="group relative inline-flex h-12 w-full items-center justify-center gap-2 bg-accent font-mono text-[0.85rem] uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-accent-dim disabled:opacity-50"
      >
        <CornerTicksBlack />
        <span className="relative inline-flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
          {!loading && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </span>
      </button>
    </form>
  );
}

function CornerTicksBlack() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 text-canvas/70">
      <Tick classes="left-[-1px] top-[-1px] border-l border-t" />
      <Tick classes="right-[-1px] top-[-1px] border-r border-t" />
      <Tick classes="left-[-1px] bottom-[-1px] border-l border-b" />
      <Tick classes="right-[-1px] bottom-[-1px] border-r border-b" />
    </span>
  );
}
function Tick({ classes }: { classes: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 border-current ${classes}`}
      style={{ width: 8, height: 8 }}
    />
  );
}
