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
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-md",
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* accent brand stripe mirroring the top bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-accent/70"
        style={{
          boxShadow: "0 0 12px rgba(255,122,26,0.4)",
        }}
      />
      {/* hatch gutter on either side, like the top bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[6px] bg-hatch-soft sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[6px] bg-hatch-soft sm:block"
      />
      {/* brand corner ticks */}
      <CornerTick classes="left-1 top-1 border-l border-t" />
      <CornerTick classes="left-1 bottom-1 border-l border-b" />
      <CornerTick classes="right-1 top-1 border-r border-t" />
      <CornerTick classes="right-1 bottom-1 border-r border-b" />

      <div className="relative mx-auto flex h-14 max-w-shell items-stretch justify-around">
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
              {active ? (
                <>
                  {/* glowing top indicator */}
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-[2px] bg-accent"
                    style={{ boxShadow: "0 0 10px rgba(255,122,26,0.85)" }}
                  />
                  {/* faint accent pill behind the active tab label */}
                  <span
                    aria-hidden
                    className="absolute inset-x-2 inset-y-1 -z-10 bg-accent/10"
                  />
                </>
              ) : null}
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active && "drop-shadow-[0_0_6px_rgba(255,122,26,0.55)]",
                )}
                strokeWidth={active ? 1.75 : 1.5}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function CornerTick({ classes }: { classes: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-1.5 w-1.5 border-accent/70 ${classes}`}
    />
  );
}
