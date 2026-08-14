"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";
import {
  Upload,
  ListMusic,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app/console", label: "Console", icon: Upload },
  { href: "/app/queue", label: "Queue", icon: ListMusic },
  { href: "/app/account", label: "Account", icon: UserRound },
] as const;

export function BottomTabs() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.dataset.mobileTabs = "mounted";
    return () => {
      delete document.documentElement.dataset.mobileTabs;
    };
  }, []);

  async function tap(href: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      /* haptics not available */
    }
    router.push(href);
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-md"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-shell items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              onClick={() => tap(tab.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] transition-colors",
                active ? "text-accent" : "text-steel-70 hover:text-bone",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-[2px] bg-accent"
                />
              )}
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
