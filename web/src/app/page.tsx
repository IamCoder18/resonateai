import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  SectionFrame,
  Kicker,
  CornerLink,
  LogoLockup,
  WaveformDivider,
  GiantWordmark,
  WordmarkPattern,
  Crosshair,
} from "@/components/brand";
import { HeroScope } from "@/components/hero-scope";
import {
  LogIn,
  Upload,
  Mail,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <main>
      <SiteHeader />
      <Hero />
      <TurnTime />
      <HowItWorks />
      <Specs />
      <CallToAction />
      <SiteFooter />
    </main>
  );
}

/* ===========================================================================
   HEADER
   ======================================================================== */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="border-b border-line bg-canvas">
        <div className="mx-auto flex h-9 max-w-shell items-center justify-center gap-6 px-6 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bone-70 sm:px-10 lg:px-[72px]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Accepting uploads
          </span>
          <span className="hidden h-3 w-px bg-white/20 sm:inline-block" />
          <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-70 sm:inline">
            ~24–48 hour turnaround
          </span>
        </div>
      </div>
      <div className="border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-shell items-center justify-between px-6 sm:px-10 lg:px-[72px]">
          <Link href="/" className="flex items-center">
            <LogoLockup />
          </Link>
          <nav className="hidden items-center gap-7 xl:flex">
            <NavLink href="#timing">Timing</NavLink>
            <NavLink href="#how">Process</NavLink>
            <NavLink href="#specs">Specs</NavLink>
            <NavLink href="/sign-in">Sign in</NavLink>
          </nav>
          <CornerLink
            href="/sign-up"
            variant="primary"
            size="sm"
            className="hidden xl:inline-flex"
          >
            Send a file
          </CornerLink>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="font-mono text-[0.78rem] uppercase tracking-[0.12em] text-bone-70 transition-colors hover:text-bone"
    >
      {children}
    </a>
  );
}

function MobileMenu() {
  return (
    <details className="group relative xl:hidden">
      <summary
        className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center border border-line bg-canvas text-bone [&::-webkit-details-marker]:hidden"
        aria-label="Open menu"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 text-canvas/70">
          <span aria-hidden className="absolute h-2 w-2 border-current" style={{ width: 8, height: 8, left: -1, top: -1, borderLeft: "1px solid", borderTop: "1px solid" }} />
          <span aria-hidden className="absolute h-2 w-2 border-current" style={{ width: 8, height: 8, right: -1, top: -1, borderRight: "1px solid", borderTop: "1px solid" }} />
          <span aria-hidden className="absolute h-2 w-2 border-current" style={{ width: 8, height: 8, left: -1, bottom: -1, borderLeft: "1px solid", borderBottom: "1px solid" }} />
          <span aria-hidden className="absolute h-2 w-2 border-current" style={{ width: 8, height: 8, right: -1, bottom: -1, borderRight: "1px solid", borderBottom: "1px solid" }} />
        </span>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="group-open:hidden">
          <path d="M0 1H16M0 6H16M0 11H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="hidden group-open:block">
          <path d="M2 2L14 10M14 2L2 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="fixed inset-x-0 top-[105px] z-30 border-y border-line bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto max-w-shell px-6 py-8">
          <div className="grid gap-1 font-mono text-[0.85rem] uppercase tracking-[0.16em]">
            <a href="#timing" className="flex items-center justify-between border-b border-line py-4 text-bone-80 hover:text-accent">
              <span>Timing</span>
              <span className="text-steel-55">01</span>
            </a>
            <a href="#how" className="flex items-center justify-between border-b border-line py-4 text-bone-80 hover:text-accent">
              <span>Process</span>
              <span className="text-steel-55">02</span>
            </a>
            <a href="#specs" className="flex items-center justify-between border-b border-line py-4 text-bone-80 hover:text-accent">
              <span>Specs</span>
              <span className="text-steel-55">03</span>
            </a>
            <a href="/sign-in" className="flex items-center justify-between border-b border-line py-4 text-bone-80 hover:text-accent">
              <span>Sign in</span>
              <span className="text-steel-55">04</span>
            </a>
            <a href="/sign-up" className="mt-6 flex items-center justify-between bg-accent px-4 py-4 text-canvas">
              <span className="font-mono uppercase tracking-[0.16em]">Send a file</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4.5 11.5L11.5 4.5M11.5 4.5H5.5M11.5 4.5V10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </details>
  );
}

/* ===========================================================================
   HERO
   ======================================================================== */
function Hero() {
  return (
    <SectionFrame
      topBorder={false}
      padding="py-6 lg:py-8"
      bg={
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-drift opacity-70"
            style={{
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 40%, #000 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 40%, #000 30%, transparent 80%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-visible"
          >
            <div
              className="resonance-sweep h-px w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent"
              style={{ boxShadow: "0 0 14px rgba(255,122,26,0.55)" }}
            />
          </div>
        </>
      }
    >
      <div className="flex flex-col items-start px-6 pt-4 sm:px-10 lg:px-[72px] lg:pt-6">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div
              className="reveal"
              style={{ ["--reveal-delay" as string]: "0ms" }}
            >
              <Kicker>Studio-grade audio cleaning · on demand</Kicker>
            </div>
            <h1
              className="reveal mt-7 font-serif text-[2.6rem] leading-[1.02] text-bone sm:text-[3.6rem] lg:text-[4.4rem]"
              style={{ ["--reveal-delay" as string]: "80ms" }}
            >
              Raw in.
              <br />
              <span className="text-accent">Clean out.</span>
            </h1>
            <p
              className="reveal mt-7 max-w-[540px] font-mono text-[0.95rem] leading-[1.65] text-bone-70 sm:text-[1rem]"
              style={{ ["--reveal-delay" as string]: "160ms" }}
            >
              Send a recording with hiss, hum, room tone, or sibilance.
              Get back a de-noised, de-essed, level-matched master —
              same format, usually within 24–48 hours.
            </p>
            <div
              className="reveal mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4"
              style={{ ["--reveal-delay" as string]: "220ms" }}
            >
              <CornerLink href="/sign-up" variant="primary" size="lg">
                Send a file
              </CornerLink>
              <a
                href="#how"
                className="group inline-flex h-14 items-center gap-2 px-4 font-mono text-[0.85rem] uppercase tracking-[0.16em] text-bone-80 transition-colors hover:text-bone"
              >
                See the process
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div
            className="reveal relative w-full"
            style={{ ["--reveal-delay" as string]: "280ms" }}
          >
            <HeroScope />
          </div>
        </div>

        <div
          className="reveal mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 self-start font-mono text-[0.7rem] uppercase tracking-[0.22em] text-steel-70 sm:mt-12"
          style={{ ["--reveal-delay" as string]: "320ms" }}
        >
          <span>MP3 · WAV · FLAC · M4A · AAC · OGG · AIFF · MP4 · MOV</span>
          <span className="hidden h-3 w-px bg-white/15 sm:inline-block" />
          <span>≤ 100 MB</span>
          <span className="hidden h-3 w-px bg-white/15 sm:inline-block" />
          <span>~24–48 h turnaround</span>
        </div>
      </div>
    </SectionFrame>
  );
}

/* ===========================================================================
   TURN TIME
   ======================================================================== */
function TurnTime() {
  const phases = [
    { n: "01", title: "Upload", desc: "Drop or pick a file. We handle the rest." },
    { n: "02", title: "Work", desc: "De-noise, de-ess, level, master." },
    { n: "03", title: "Email", desc: "A download link lands in your inbox." },
  ];
  return (
    <SectionFrame
      id="timing"
      bg={
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 bg-dot-grid"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)",
          }}
        />
      }
    >
      <div className="grid items-start gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="reveal" style={{ ["--reveal-delay" as string]: "0ms" }}>
            <Kicker>Timing</Kicker>
          </div>
          <h2
            className="reveal mt-6 font-serif text-[2.4rem] leading-[1.04] text-bone sm:text-[3rem]"
            style={{ ["--reveal-delay" as string]: "80ms" }}
          >
            Usually a day or two.
            <br />
            <span className="text-accent">Sometimes faster.</span>
          </h2>
          <p
            className="reveal mt-6 max-w-[520px] font-mono text-[0.95rem] leading-[1.65] text-bone-70"
            style={{ ["--reveal-delay" as string]: "160ms" }}
          >
            One queue, one schedule. Your ETA lands on the dashboard the
            moment your file is ingested.
          </p>
          <div
            className="reveal mt-10 grid grid-cols-2 gap-px border border-line bg-line"
            style={{ ["--reveal-delay" as string]: "220ms" }}
          >
            <Cell label="Ingest" value="≤ 60s" />
            <Cell label="Typical turnaround" value="24–48h" />
            <Cell label="Format in" value="9 formats" />
            <Cell label="Format out" value="Same as input" />
          </div>
        </div>
        <div className="reveal" style={{ ["--reveal-delay" as string]: "120ms" }}>
          <TimelineCard />
        </div>
      </div>
      <div className="mt-14 grid grid-cols-1 border-t border-line md:grid-cols-3">
        {phases.map((p, i) => (
          <div
            key={p.n}
            className={`relative px-2 py-10 md:px-8${
              i > 0 ? " border-t border-line md:border-l md:border-t-0" : ""
            }`}
          >
            <Crosshair className="z-10 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/30" />
            <div className="flex items-center justify-between font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-70">
              <span>Phase {p.n}</span>
              <span className="text-steel-55">[{i + 1}/3]</span>
            </div>
            <h3 className="mt-6 font-serif text-[1.5rem] font-normal leading-[1.15] text-bone">
              {p.title}
            </h3>
            <p className="mt-3 font-mono text-[0.85rem] leading-[1.55] text-steel-70">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas p-6">
      <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
        {label}
      </div>
      <div className="mt-2 font-serif text-[1.4rem] leading-tight text-bone">
        {value}
      </div>
    </div>
  );
}

function TimelineCard() {
  return (
    <div className="border border-line bg-panel-30">
      <div className="border-b border-line px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-70">
        Delivery window
      </div>
      <div className="px-6 py-10">
        <div className="space-y-6">
          {[
            { label: "Upload", color: "bg-accent" },
            { label: "Ingest", color: "bg-bone" },
            { label: "Clean & master", color: "bg-bone" },
            { label: "QA · send", color: "bg-accent" },
          ].map((m, i, arr) => (
            <div
              key={m.label}
              className="relative grid grid-cols-[40px_1fr] items-center gap-4"
            >
              <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-70">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="relative">
                <div className="h-px w-full bg-line" />
                <div
                  className={`absolute -top-1 left-0 h-2.5 w-2.5 ${m.color}`}
                  style={{
                    boxShadow:
                      m.color === "bg-accent"
                        ? "0 0 10px rgba(255,122,26,0.6)"
                        : "none",
                  }}
                />
                <div className="mt-3 font-mono text-[0.8rem] text-bone-80">
                  {m.label}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div className="col-start-2 ml-1 h-3 w-px bg-line" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-line pt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-55">
          Usually 24–48 hours from upload
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   HOW IT WORKS
   ======================================================================== */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Make an account",
      desc: "Email and password. Under a minute.",
      icon: LogIn,
    },
    {
      n: "02",
      title: "Upload",
      desc: "Drag or pick. We reject on size, not on format.",
      icon: Upload,
    },
    {
      n: "03",
      title: "Receive",
      desc: "A link lands in your inbox — usually within a day or two.",
      icon: Mail,
    },
  ];
  return (
    <SectionFrame id="how">
      <div
        className="reveal flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        style={{ ["--reveal-delay" as string]: "0ms" }}
      >
        <div>
          <Kicker>Process</Kicker>
          <h2 className="mt-6 font-serif text-[2.4rem] leading-[1.04] text-bone sm:text-[3rem]">
            Three steps.
          </h2>
        </div>
      </div>
      <div className="mt-14 grid grid-cols-1 border-t border-line md:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className={`relative flex min-h-[300px] flex-col px-2 py-10 md:px-8${
              i > 0 ? " border-t border-line md:border-l md:border-t-0" : ""
            }`}
          >
            <Crosshair className="z-10 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/30" />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-line bg-panel-40 text-accent">
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="font-mono text-[0.95rem] tracking-[0.12em] text-steel-70">
                [{s.n}]
              </span>
            </div>
            <h3 className="mt-10 font-serif text-[1.8rem] font-normal leading-[1.1] text-bone">
              {s.title}
            </h3>
            <p className="mt-3 max-w-[300px] font-mono text-[0.9rem] leading-[1.6] text-steel-70">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* ===========================================================================
   SPECS
   ======================================================================== */
function Specs() {
  const specs = [
    { k: "Max size", v: "100 MB" },
    { k: "Typical turnaround", v: "24–48 hours" },
    { k: "Formats", v: "9 in · same out" },
    { k: "Retention", v: "7 days, then purged" },
  ];
  return (
    <SectionFrame id="specs">
      <div
        className="reveal flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        style={{ ["--reveal-delay" as string]: "0ms" }}
      >
        <div>
          <Kicker>Specs</Kicker>
          <h2 className="mt-6 font-serif text-[2.4rem] leading-[1.04] text-bone sm:text-[3rem]">
            Spec sheet.
          </h2>
        </div>
        <p className="max-w-[420px] font-mono text-[0.9rem] leading-[1.65] text-bone-70">
          Everything before the upload. No fine print.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {specs.map((s) => (
          <div key={s.k} className="bg-canvas p-7">
            <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
              {s.k}
            </div>
            <div className="mt-3 font-serif text-[1.3rem] leading-snug text-bone">
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

/* ===========================================================================
   CALL TO ACTION
   ======================================================================== */
function CallToAction() {
  return (
    <SectionFrame
      bg={
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40"
            style={{
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 80%)",
            }}
          />
          <CornerDots className="left-10 top-10" />
          <CornerDots className="right-10 top-10 rotate-90" />
          <CornerDots className="bottom-10 left-10 -rotate-90" />
          <CornerDots className="bottom-10 right-10 rotate-180" />
        </>
      }
    >
      <div className="flex flex-col items-start px-6 py-16 lg:py-24">
        <div className="reveal" style={{ ["--reveal-delay" as string]: "0ms" }}>
          <Kicker tone="accent">Accepting uploads</Kicker>
        </div>
        <h2
          className="reveal mt-6 max-w-[800px] font-serif text-[2.6rem] leading-[1.04] text-bone sm:text-[3.6rem]"
          style={{ ["--reveal-delay" as string]: "80ms" }}
        >
          Drop a file.
          <br />
          <span className="text-accent">Get it back clean.</span>
        </h2>
        <p
          className="reveal mt-6 max-w-[520px] font-mono text-[0.95rem] leading-[1.65] text-bone-70"
          style={{ ["--reveal-delay" as string]: "160ms" }}
        >
          Same format out. Usually back in a day or two.
        </p>
        <div
          className="reveal mt-10"
          style={{ ["--reveal-delay" as string]: "220ms" }}
        >
          <CornerLink href="/sign-up" variant="primary" size="lg">
            Send a file
          </CornerLink>
        </div>
        <div
          className="reveal mt-16 w-full max-w-[800px]"
          style={{ ["--reveal-delay" as string]: "320ms" }}
        >
          <WaveformDivider variant="marquee" />
        </div>
      </div>
    </SectionFrame>
  );
}

function CornerDots({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className={`pointer-events-none absolute z-10 hidden text-white/40 lg:block ${className || ""}`}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <circle
          key={i}
          cx={4 + (i % 3) * 10}
          cy={4 + Math.floor(i / 3) * 10}
          r="1.3"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/* ===========================================================================
   FOOTER
   ======================================================================== */
function SiteFooter() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-line">
      <div className="relative mx-auto w-full max-w-shell">
        <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[44px] bg-hatch lg:block" />
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[44px] bg-hatch lg:block" />
        <div className="pointer-events-none absolute inset-y-0 left-[44px] right-[44px] hidden border-x border-line lg:block" />
        <Crosshair className="z-20 left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
        <Crosshair className="z-20 right-0 top-0 translate-x-1/2 -translate-y-1/2" />
        <WordmarkPattern />
        <div className="relative px-6 pt-16 sm:px-10 lg:px-[72px]">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <LogoLockup />
              <p className="mt-6 max-w-[300px] font-mono text-[0.85rem] leading-[1.6] text-steel-70">
                Raw in, clean out. Send a file, get a polished master back —
                usually within a day or two.
              </p>
              <div className="mt-6">
                <CornerLink href="/sign-up" variant="primary" size="sm">
                  Send a file
                </CornerLink>
              </div>
              <div className="mt-10 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-steel-55">
                © Resonate AI
              </div>
            </div>
            <FooterCol
              title="Site"
              links={[
                { label: "Timing", href: "#timing" },
                { label: "Process", href: "#how" },
                { label: "Specs", href: "#specs" },
              ]}
            />
            <FooterCol
              title="Account"
              links={[
                { label: "Sign in", href: "/sign-in" },
                { label: "Create account", href: "/sign-up" },
              ]}
            />
            <FooterCol
              title="Contact"
              links={[
                { label: "resonateai.contact@aaravlabs.com", href: "mailto:resonateai.contact@aaravlabs.com" },
              ]}
            />
          </div>
          <GiantWordmark />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="mb-4 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-55">
        {title}
      </div>
      <ul className="space-y-3 font-mono text-[0.92rem]">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="text-bone-80 transition-colors hover:text-accent">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}