"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AccountScreen } from "@/components/account-screen";
import { Loader2 } from "lucide-react";

export default function AppAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await authClient.getSession();
        if (cancelled) return;
        if (!session.data) router.replace("/app/sign-in");
        else setUser(session.data.user);
      } catch {
        if (!cancelled) router.replace("/app/sign-in");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-steel-70" />
      </div>
    );
  }

  return <AccountScreen user={user} />;
}
