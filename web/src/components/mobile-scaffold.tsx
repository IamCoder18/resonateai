"use client";

import { BrandMark, LogoLockup } from "@/components/brand";
import { BottomTabs } from "@/components/bottom-tabs";
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
      {showHeader && (
        <header
          className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex h-12 max-w-shell items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <BrandMark size={18} className="text-accent" />
              <span className="font-serif text-[1.05rem] leading-none">
                Resonate AI
              </span>
            </div>
            {title && (
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-steel-70">
                {title}
              </span>
            )}
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

export { LogoLockup };
