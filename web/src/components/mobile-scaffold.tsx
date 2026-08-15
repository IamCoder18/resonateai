"use client";

import { BrandMark, LogoLockup } from "@/components/brand";
import { BottomTabs } from "@/components/bottom-tabs";
import { NativeBrandChrome } from "@/components/native-brand-chrome";
import { usePathname } from "next/navigation";

const NO_TAB_ROUTES = new Set([
  "/app/sign-in",
  "/app/sign-up",
  "/app/intro",
]);
const NO_HEADER_ROUTES = new Set(["/app/intro"]);

interface Props {
  title?: string;
  children: React.ReactNode;
}

export function MobileScaffold({ title, children }: Props) {
  const pathname = usePathname();
  const showTabs = !NO_TAB_ROUTES.has(pathname);
  const showHeader = !NO_HEADER_ROUTES.has(pathname);

  return (
    <div className="relative min-h-screen bg-canvas">
      <NativeBrandChrome />

      {showHeader && (
        <header
          className="sticky top-0 z-40 backdrop-blur-md"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-top)",
            minHeight: "calc(env(safe-area-inset-top) + 56px)",
            backgroundImage:
              "linear-gradient(to bottom," +
              "  rgba(122,56,24,1.00)    0%," +
              "  rgba(122,56,24,0.90)    6%," +
              "  rgba(122,56,24,0.68)   14%," +
              "  rgba(122,56,24,0.46)   24%," +
              "  rgba(122,56,24,0.30)   36%," +
              "  rgba(122,56,24,0.18)   50%," +
              "  rgba(122,56,24,0.10)   64%," +
              "  rgba(122,56,24,0.05)   78%," +
              "  rgba(122,56,24,0.02)   90%," +
              "  rgba(10,9,7,1.00)     100%)",
          }}
        >
          {/* outer hatch gutter on either side, like the marketing site */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[6px] bg-hatch-soft sm:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[6px] bg-hatch-soft sm:block"
          />
          {/* brand corner ticks — left */}
          <CornerTick classes="left-1 top-1 border-l border-t" />
          <CornerTick classes="left-1 bottom-1 border-l border-b" />
          {/* brand corner ticks — right */}
          <CornerTick classes="right-1 top-1 border-r border-t" />
          <CornerTick classes="right-1 bottom-1 border-r border-b" />

          <div className="relative mx-auto flex h-14 max-w-shell items-center justify-between px-5">
            <div className="flex items-center gap-2.5">
              <BrandMark
                size={20}
                className="text-accent drop-shadow-[0_0_6px_rgba(122,56,24,0.55)]"
              />
              <span className="font-serif text-[1.05rem] leading-none tracking-[-0.01em]">
                Resonate AI
              </span>
            </div>
            {title ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-steel-70">
                <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_rgba(255,122,26,0.7)]" />
                {title}
              </span>
            ) : null}
          </div>
        </header>
      )}

      <main
        className="mx-auto max-w-shell px-4 pb-24 pt-4"
        style={{
          paddingBottom: showTabs
            ? "calc(env(safe-area-inset-bottom) + 5rem)"
            : "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </main>

      {showTabs && <BottomTabs />}
    </div>
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

export { LogoLockup };
