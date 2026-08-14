"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/intro");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="font-mono text-[0.78rem] uppercase tracking-[0.18em] text-steel-70">
        Loading…
      </div>
    </div>
  );
}
