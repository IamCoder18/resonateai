import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";
import { SectionFrame, LogoLockup, Crosshair } from "@/components/brand";

export default function SignInPage() {
  return (
    <main className="min-h-screen">
      <TopBar />
      <SectionFrame
        topBorder={false}
        className="!py-16 lg:!py-24"
        bg={
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-drift opacity-40"
            style={{
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)",
            }}
          />
        }
      >
        <div className="relative grid items-start gap-16 lg:grid-cols-[1fr_1.05fr]">
          <div className="flex flex-col gap-8">
            <Link href="/" className="inline-flex">
              <LogoLockup />
            </Link>
            <h1 className="font-serif text-[2.6rem] leading-[1.04] text-bone sm:text-[3.4rem]">
              Sign in.
            </h1>
            <p className="max-w-[420px] font-mono text-[0.95rem] leading-[1.65] text-bone-70">
              Resume your queue. Upload, check status, or pull the
              cleaned file.
            </p>
          </div>
          <div className="relative">
            <div className="relative border border-line bg-panel-30">
              <Crosshair className="z-20 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/40" />
              <Crosshair className="z-20 right-0 top-0 translate-x-1/2 -translate-y-1/2 text-white/40" />
              <Crosshair className="z-20 left-0 bottom-0 -translate-x-1/2 translate-y-1/2 text-white/40" />
              <Crosshair className="z-20 right-0 bottom-0 translate-x-1/2 translate-y-1/2 text-white/40" />
              <div className="px-7 py-9 sm:px-10 sm:py-10">
                <Suspense fallback={null}>
                  <SignInForm />
                </Suspense>
              </div>
            </div>
            <p className="mt-8 text-center font-mono text-[0.85rem] text-steel-70">
              No account?{" "}
              <Link
                href="/sign-up"
                className="text-bone underline underline-offset-4 hover:text-accent"
              >
                Make one
              </Link>
            </p>
          </div>
        </div>
      </SectionFrame>
    </main>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-shell items-center justify-between px-6 sm:px-10 lg:px-[72px]">
        <Link href="/" className="flex items-center">
          <LogoLockup />
        </Link>
        <div className="hidden items-center gap-7 xl:flex">
          <a
            href="/#how"
            className="font-mono text-[0.78rem] uppercase tracking-[0.12em] text-bone-70 transition-colors hover:text-bone"
          >
            Process
          </a>
          <a
            href="/#specs"
            className="font-mono text-[0.78rem] uppercase tracking-[0.12em] text-bone-70 transition-colors hover:text-bone"
          >
            Specs
          </a>
        </div>
        <CornerLinkBtn href="/sign-up" size="sm">
          Create account
        </CornerLinkBtn>
      </div>
    </header>
  );
}

function CornerLinkBtn({
  href,
  children,
  size,
}: {
  href: string;
  children: React.ReactNode;
  size: "sm" | "md";
}) {
  const sizeCls = size === "sm" ? "h-10 px-5 text-[0.72rem]" : "h-12 px-6 text-[0.78rem]";
  return (
    <a
      href={href}
      className={`group relative hidden items-center justify-center gap-2 bg-accent font-mono uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-accent-dim sm:inline-flex ${sizeCls}`}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 text-canvas/70">
        <Tick c="left-[-1px] top-[-1px] border-l border-t" />
        <Tick c="right-[-1px] top-[-1px] border-r border-t" />
        <Tick c="left-[-1px] bottom-[-1px] border-l border-b" />
        <Tick c="right-[-1px] bottom-[-1px] border-r border-b" />
      </span>
      <span className="relative">{children}</span>
    </a>
  );
}

function Tick({ c }: { c: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 border-current ${c}`}
      style={{ width: 8, height: 8 }}
    />
  );
}