"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AppIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await authClient.getSession();
        if (cancelled) return;
        router.replace(session.data ? "/app/console" : "/app/intro");
      } catch {
        if (!cancelled) router.replace("/app/intro");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="font-mono text-[0.78rem] uppercase tracking-[0.18em] text-steel-70">
        Loading…
      </div>
    </div>
  );
}
