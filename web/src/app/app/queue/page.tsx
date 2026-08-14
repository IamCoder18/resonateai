"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { MobileQueueList } from "@/components/mobile-queue-list";
import { Loader2 } from "lucide-react";

export default function AppQueuePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await authClient.getSession();
        if (cancelled) return;
        if (!session.data) router.replace("/app/sign-in");
        else setReady(true);
      } catch {
        if (!cancelled) router.replace("/app/sign-in");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-steel-70" />
      </div>
    );
  }

  return <MobileQueueList />;
}
