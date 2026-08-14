"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload, Sparkles, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { WaveformDivider, BrandMark } from "@/components/brand";

type Phase = "raw" | "clean";

export default function AppIntroPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("raw");

  useEffect(() => {
    setReady(true);
    const id = setInterval(() => {
      setPhase((p) => (p === "raw" ? "clean" : "raw"));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const finish = async (intent: "sign-in" | "sign-up") => {
    let signedIn = false;
    try {
      const session = await authClient.getSession();
      signedIn = !!session.data;
    } catch {}
    if (signedIn) router.replace("/app/console");
    else if (intent === "sign-up") router.replace("/app/sign-up");
    else router.replace("/app/sign-in");
  };

  if (!ready) return null;

  return (
    <div className="relative">
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "14px 14px",
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 30%, #000 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 50% 30%, #000 30%, transparent 80%)",
          }}
        />
      </div>

      {/* minimal top bar */}
      <div
        className="relative flex items-center gap-2 px-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.1rem)" }}
      >
        <BrandMark size={18} className="text-accent" />
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-steel-70">
          Resonate AI
        </span>
      </div>

      {/* hero */}
      <section className="relative mx-auto max-w-md px-6 pt-14">
        <div className="reveal" style={{ ["--reveal-delay" as string]: "0ms" }}>
          <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(255,122,26,0.7)]" />
            Welcome
          </span>
        </div>
        <h1
          className="reveal mt-5 font-serif text-[3.2rem] leading-[0.92] tracking-[-0.02em] text-bone"
          style={{ ["--reveal-delay" as string]: "100ms" }}
        >
          Raw in.
          <br />
          <span className="text-accent">Clean out.</span>
        </h1>
        <p
          className="reveal mt-6 font-mono text-[0.95rem] leading-[1.6] text-bone-70"
          style={{ ["--reveal-delay" as string]: "200ms" }}
        >
          Send a recording with hiss, hum, or room noise. Get a
          cleaner version back in the same format — usually within
          a day or two.
        </p>
      </section>

      {/* the wow: animated before/after waveform */}
      <section
        className="relative mx-auto mt-12 max-w-md px-6"
        style={{ ["--reveal-delay" as string]: "300ms" } as React.CSSProperties}
      >
        <div className="reveal">
          <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-[0.22em]">
            <span
              className={
                phase === "raw" ? "text-accent" : "text-steel-55"
              }
            >
              {phase === "raw" ? "● Raw input" : "● Clean output"}
            </span>
            <span className="text-steel-55">
              {phase === "raw" ? "Processing →" : "Done ✓"}
            </span>
          </div>
          <WaveformViz phase={phase} />
          <div className="mt-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.2em] text-steel-55">
            <span>L</span>
            <span>R</span>
          </div>
        </div>
      </section>

      {/* marquee divider */}
      <div className="reveal mt-12 overflow-hidden">
        <WaveformDivider variant="marquee" />
      </div>

      {/* process */}
      <section className="relative mx-auto mt-12 max-w-md px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[1.4rem] leading-tight text-bone">
            How it works
          </h2>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-steel-70">
            3 steps
          </span>
        </div>
        <ol className="reveal mt-5 grid gap-px border border-line bg-line">
          <Step
            n="01"
            icon={Upload}
            title="Upload"
            desc="Drop or pick a file. We accept 9 formats, up to 100 MB."
          />
          <Step
            n="02"
            icon={Sparkles}
            title="Clean up"
            desc="We clean the audio. Same format out."
          />
          <Step
            n="03"
            icon={Mail}
            title="Receive"
            desc="A download link lands in your inbox — usually within a day."
          />
        </ol>
      </section>

      {/* specs */}
      <section className="relative mx-auto mt-10 max-w-md px-6">
        <div className="reveal grid grid-cols-3 gap-px border border-line bg-line">
          <Spec k="Max size" v="100 MB" />
          <Spec k="Turnaround" v="24–48h" />
          <Spec k="Formats" v="9 in" />
        </div>
        <p className="reveal mt-4 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-55">
          MP3 · WAV · FLAC · M4A · AAC · OGG · AIFF · MP4 · MOV
        </p>
      </section>

      {/* reassurance */}
      <section className="relative mx-auto mt-10 max-w-md px-6">
        <div className="reveal border border-line bg-panel-30 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(255,122,26,0.7)]" />
            <p className="font-mono text-[0.82rem] leading-[1.55] text-bone-70">
              One queue, one schedule. We'll email a download link the
              moment your file is ready. Files are purged after 7 days.
            </p>
          </div>
        </div>
      </section>

      <div className="h-44" />

      {/* sticky bottom CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-md"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 0.9rem)",
          paddingTop: "0.9rem",
        }}
      >
        <div className="mx-auto max-w-md px-5">
          <button
            onClick={() => finish("sign-up")}
            className="group inline-flex h-14 w-full items-center justify-center gap-2 bg-accent font-mono text-[0.85rem] uppercase tracking-[0.16em] text-canvas transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => finish("sign-in")}
            className="mt-2 inline-flex h-11 w-full items-center justify-center font-mono text-[0.78rem] uppercase tracking-[0.16em] text-bone-70 transition-colors hover:text-bone"
          >
            I already have an account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   Waveform visualization — two layers crossfading, with a moving scan line
   ======================================================================== */
function WaveformViz({ phase }: { phase: Phase }) {
  const bars = 72;
  const clean = Array.from({ length: bars }, (_, i) => {
    const x = i / (bars - 1);
    const env = Math.sin(x * Math.PI);
    const wave =
      0.55 +
      0.32 * Math.sin(i * 0.55) +
      0.18 * Math.sin(i * 1.2 + 1.2);
    return Math.max(0.18, env * Math.abs(wave));
  });
  const raw = clean.map((h, i) => {
    const noise =
      0.5 +
      0.5 *
        Math.sin(i * 7.31 + 1.7) *
        Math.cos(i * 3.17 + 0.4);
    const jitter = 0.25 + 0.65 * Math.abs(noise);
    return Math.min(1, h * 0.55 + jitter * 0.55);
  });

  return (
    <div className="relative mt-3 h-36 w-full overflow-hidden border border-line bg-panel-30">
      {/* faint baseline */}
      <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px bg-line" />

      {/* raw layer */}
      <div
        className="absolute inset-0 flex items-center px-3 transition-opacity duration-[700ms]"
        style={{ opacity: phase === "raw" ? 1 : 0 }}
      >
        <div className="flex h-full w-full items-center justify-between gap-[1.5px]">
          {raw.map((h, i) => (
            <div
              key={`r-${i}`}
              className="flex-1 bg-steel-70"
              style={{ height: `${h * 88}%`, minHeight: "2px" }}
            />
          ))}
        </div>
      </div>

      {/* clean layer */}
      <div
        className="absolute inset-0 flex items-center px-3 transition-opacity duration-[700ms]"
        style={{ opacity: phase === "clean" ? 1 : 0 }}
      >
        <div className="flex h-full w-full items-center justify-between gap-[1.5px]">
          {clean.map((h, i) => (
            <div
              key={`c-${i}`}
              className="flex-1 bg-accent"
              style={{
                height: `${h * 88}%`,
                minHeight: "2px",
                boxShadow:
                  i % 12 === 0
                    ? "0 0 10px rgba(255,122,26,0.65)"
                    : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* scanning line */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-accent/80"
        style={{
          left: phase === "raw" ? "0%" : "100%",
          transition: "left 2400ms cubic-bezier(0.65, 0, 0.35, 1)",
          boxShadow:
            "0 0 14px rgba(255,122,26,0.85), 0 0 4px rgba(255,122,26,1)",
        }}
      />

      {/* corner ticks */}
      <CornerTicks />
    </div>
  );
}

function CornerTicks() {
  const tick =
    "absolute h-2 w-2 border-white/40";
  return (
    <>
      <span
        className={`${tick} border-l border-t`}
        style={{ left: 4, top: 4 }}
      />
      <span
        className={`${tick} border-r border-t`}
        style={{ right: 4, top: 4 }}
      />
      <span
        className={`${tick} border-l border-b`}
        style={{ left: 4, bottom: 4 }}
      />
      <span
        className={`${tick} border-r border-b`}
        style={{ right: 4, bottom: 4 }}
      />
    </>
  );
}

/* ===========================================================================
   Process step
   ======================================================================== */
function Step({
  n,
  icon: Icon,
  title,
  desc,
}: {
  n: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-4 bg-canvas p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-panel-40 text-accent">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-serif text-[1.15rem] leading-tight text-bone">
            {title}
          </div>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-steel-55">
            [{n}]
          </span>
        </div>
        <p className="mt-1 font-mono text-[0.82rem] leading-[1.55] text-steel-70">
          {desc}
        </p>
      </div>
    </li>
  );
}

/* ===========================================================================
   Spec cell
   ======================================================================== */
function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-canvas p-4">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-steel-70">
        {k}
      </div>
      <div className="mt-2 font-serif text-[1.15rem] leading-tight text-bone">
        {v}
      </div>
    </div>
  );
}
