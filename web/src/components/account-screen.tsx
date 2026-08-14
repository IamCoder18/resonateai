"use client";

import { useRouter } from "next/navigation";
import { LogOut, ExternalLink, Info } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface Props {
  user: { id: string; name: string; email: string };
}

export function AccountScreen({ user }: Props) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/app/sign-in");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          Signed in as
        </div>
        <div className="mt-2 font-serif text-[1.6rem] leading-tight text-bone">
          {user.name}
        </div>
        <div className="mt-1 font-mono text-[0.85rem] text-bone-70">
          {user.email}
        </div>
      </div>

      <div className="border border-line bg-panel-30">
        <a
          href="https://resonate.aaravlabs.com"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center justify-between border-b border-line px-4 py-3 transition-colors hover:bg-white/2"
        >
          <span className="font-mono text-[0.85rem] text-bone">
            Open our website
          </span>
          <ExternalLink className="h-4 w-4 text-steel-70" strokeWidth={1.5} />
        </a>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="inline-flex items-center gap-2 font-mono text-[0.85rem] text-steel-70">
            <Info className="h-4 w-4" strokeWidth={1.5} />
            App version
          </span>
          <span className="font-mono text-[0.85rem] text-bone">
            Preview
          </span>
        </div>
      </div>

      <button
        onClick={signOut}
        className="group relative inline-flex h-12 w-full items-center justify-center gap-2 border border-white/20 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-bone transition-colors hover:border-white/40 hover:bg-white/5"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        Sign out
      </button>
    </div>
  );
}
