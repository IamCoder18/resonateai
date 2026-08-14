import type { ReactNode, HTMLAttributes, AnchorHTMLAttributes } from "react";
import { clsx } from "clsx";

/* ============ Crosshair mark (corner crop) ============ */
export function Crosshair({
  className,
  tone = "30",
}: {
  className?: string;
  tone?: "30" | "40";
}) {
  return (
    <span
      aria-hidden
      className={clsx(
        "pointer-events-none absolute",
        tone === "30" ? "text-white/30" : "text-white/40",
        className,
      )}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5V12.5" stroke="currentColor" strokeWidth="1" />
        <path d="M1.5 7H12.5" stroke="currentColor" strokeWidth="1" />
      </svg>
    </span>
  );
}

/* ============ SectionFrame — wraps a section with the brand chrome ============ */
export function SectionFrame({
  children,
  className,
  innerClassName,
  topBorder = true,
  bg,
  id,
  padding = "py-16 lg:py-24",
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  topBorder?: boolean;
  bg?: ReactNode;
  id?: string;
  padding?: string;
}) {
  return (
    <section
      id={id}
      className={clsx(
        "relative w-full overflow-hidden",
        topBorder && "border-t border-line",
        className,
      )}
    >
      {bg}
      <div className="relative mx-auto w-full max-w-shell">
        {/* outer gutter hatches */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 hidden w-[44px] bg-hatch lg:block"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 hidden w-[44px] bg-hatch lg:block"
        />
        {/* inner column border-x */}
        <div className="pointer-events-none absolute inset-y-0 left-[44px] right-[44px] hidden border-x border-line lg:block" />
        {/* outer corner crosses */}
        <Crosshair className="z-20 left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
        <Crosshair className="z-20 right-0 top-0 translate-x-1/2 -translate-y-1/2" />
        <Crosshair className="z-20 left-0 bottom-0 -translate-x-1/2 translate-y-1/2" />
        <Crosshair className="z-20 right-0 bottom-0 translate-x-1/2 translate-y-1/2" />
        {/* content */}
        <div className={padding}>
          <div className={clsx("relative px-6 sm:px-10 lg:px-[72px]", innerClassName)}>
            {/* inner corner crosses */}
            <Crosshair className="z-20 left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
            <Crosshair className="z-20 right-0 top-0 translate-x-1/2 -translate-y-1/2" />
            <Crosshair className="z-20 left-0 bottom-0 -translate-x-1/2 translate-y-1/2" />
            <Crosshair className="z-20 right-0 bottom-0 translate-x-1/2 translate-y-1/2" />
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ Kicker pill (eyebrow label) ============ */
export function Kicker({
  children,
  className,
  tone = "bone",
}: {
  children: ReactNode;
  className?: string;
  tone?: "bone" | "accent" | "steel";
}) {
  const colorClass =
    tone === "accent"
      ? "text-accent"
      : tone === "steel"
        ? "text-steel"
        : "text-bone";
  return (
    <span
      className={clsx(
        "relative inline-flex items-center overflow-hidden border border-line",
        "px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.18em]",
        colorClass,
        className,
      )}
    >
      <span aria-hidden className="absolute inset-0 -z-0 bg-hatch-soft" />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

/* ============ Corner-bracket button ============ */
type ButtonProps = HTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  asChild?: boolean;
  children: ReactNode;
};

const btnSize = {
  sm: "h-10 px-5 text-[0.72rem]",
  md: "h-12 px-6 text-[0.78rem]",
  lg: "h-14 px-8 text-[0.85rem]",
};

export function CornerButton({
  variant = "primary",
  size = "md",
  arrow = true,
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.16em] transition-colors duration-200 select-none";
  const styles =
    variant === "primary"
      ? "bg-accent text-canvas hover:bg-accent-dim"
      : "border border-white/20 text-bone hover:bg-white/5 hover:border-white/40";
  return (
    <button
      className={clsx(base, btnSize[size], styles, className)}
      {...rest}
    >
      <CornerTicks tone={variant === "primary" ? "current" : "light"} />
      <span className="relative">{children}</span>
      {arrow && (
        <CornerArrow />
      )}
    </button>
  );
}

/* ============ Corner-bracket link (for routing) ============ */
export function CornerLink({
  variant = "primary",
  size = "md",
  arrow = true,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  children: ReactNode;
}) {
  const base =
    "group relative inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.16em] transition-colors duration-200 select-none no-underline";
  const styles =
    variant === "primary"
      ? "bg-accent text-canvas hover:bg-accent-dim"
      : "border border-white/20 text-bone hover:bg-white/5 hover:border-white/40";
  return (
    <a className={clsx(base, btnSize[size], styles, className)} {...rest}>
      <CornerTicks tone={variant === "primary" ? "current" : "light"} />
      <span className="relative">{children}</span>
      {arrow && <CornerArrow />}
    </a>
  );
}

/* ============ Corner ticks (shared between button & link) ============ */
function CornerTicks({ tone = "current" }: { tone?: "current" | "light" }) {
  const color =
    tone === "light" ? "text-white/70" : "text-canvas/70";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${color}`}
    >
      <Tick classes="left-[-1px] top-[-1px] border-l border-t" />
      <Tick classes="right-[-1px] top-[-1px] border-r border-t" />
      <Tick classes="left-[-1px] bottom-[-1px] border-l border-b" />
      <Tick classes="right-[-1px] bottom-[-1px] border-r border-b" />
    </span>
  );
}

function Tick({ classes }: { classes: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 border-current ${classes}`}
      style={{ width: 8, height: 8 }}
    />
  );
}

/* ============ Corner arrow (nudges on hover) ============ */
function CornerArrow() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    >
      <path
        d="M4.5 11.5L11.5 4.5M11.5 4.5H5.5M11.5 4.5V10.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============ Brand mark — used as inline icon ============ */
export function BrandMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M4 32 Q9 32 11 22 T17 32 T23 32 T29 32 T35 32 T41 32 T60 32"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="22" r="2.5" fill="currentColor" />
      <circle cx="23" cy="32" r="2.5" fill="currentColor" />
      <circle cx="41" cy="32" r="2.5" fill="currentColor" />
    </svg>
  );
}

/* ============ Logo lockup (used in header) ============ */
export function LogoLockup({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={22} className={clsx("text-accent", markClassName)} />
      <span className="font-serif text-[1.15rem] leading-none tracking-[-0.01em]">
        <span className="font-normal">Resonate</span>
        <span className="font-serif"> AI</span>
      </span>
    </span>
  );
}

/* ============ Waveform decorative divider ============ */
export function WaveformDivider({
  className,
  variant = "static",
}: {
  className?: string;
  variant?: "static" | "marquee";
}) {
  const path =
    "M0 12 H4 L8 4 L12 20 L16 8 L20 18 L24 6 L28 16 L32 2 L36 22 L40 10 L44 18 L48 6 L52 16 L56 4 L60 12 H64";
  if (variant === "marquee") {
    return (
      <div className={clsx("relative overflow-hidden", className)}>
        <div className="flex w-max marquee-track">
          <WaveSvg path={path} />
          <WaveSvg path={path} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-canvas to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-canvas to-transparent" />
      </div>
    );
  }
  return (
    <div className={clsx("relative h-6 w-full overflow-hidden", className)}>
      <WaveSvg path={path} />
    </div>
  );
}
function WaveSvg({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 64 24"
      preserveAspectRatio="none"
      className="h-6 w-[640px] shrink-0 text-accent/45"
      fill="none"
    >
      <path d={path} stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/* ============ Footer giant wordmark ============ */
export function GiantWordmark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx("pointer-events-none mt-16 select-none pb-2", className)}
    >
      <svg
        viewBox="0 0 1200 200"
        className="block w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="wm-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f1ea" stopOpacity="0.22" />
            <stop offset="1" stopColor="#f4f1ea" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <text
          x="600"
          y="155"
          textAnchor="middle"
          textLength="1190"
          lengthAdjust="spacingAndGlyphs"
          fontFamily="var(--font-serif)"
          fontWeight="400"
          fontSize="180"
          fill="url(#wm-grad)"
        >
          Resonate AI
        </text>
      </svg>
    </div>
  );
}

/* ============ Footer pattern — sparse watermark behind giant wordmark ============ */
export function WordmarkPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-y-0 left-[44px] right-[44px] hidden lg:block",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at center, rgba(244,241,234,0.05) 1px, transparent 1.5px)",
        backgroundSize: "48px 48px",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, #000 60%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, #000 60%, transparent 100%)",
      }}
    />
  );
}

/* ============ HUD-style status pill ============ */
export function HudBadge({
  children,
  tone = "default",
  className,
  pulse = false,
}: {
  children: ReactNode;
  tone?: "default" | "ready" | "fail" | "accent" | "rocking";
  className?: string;
  pulse?: boolean;
}) {
  const palette = {
    default: "border-line text-bone-80 bg-panel-30",
    ready: "border-accent-40 text-accent bg-accent-10",
    fail: "border-line text-bone-80 bg-panel-30",
    accent: "border-accent-40 text-accent bg-accent-10",
    rocking: "border-line text-bone-80 bg-panel-30",
  }[tone];
  const dot = {
    default: "bg-bone",
    ready: "bg-accent",
    fail: "bg-bone",
    accent: "bg-accent",
    rocking: "bg-accent",
  }[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.18em]",
        palette,
        className,
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          dot,
          pulse && "pulse-soft",
        )}
      />
      {children}
    </span>
  );
}

/* ============ Vertical caption (left-rotated mono tag) ============ */
export function VerticalTag({
  children,
  className,
  rotate = 0,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      className={clsx(
        "hidden font-mono text-[0.6rem] uppercase tracking-[0.22em] text-steel lg:inline-block",
        className,
      )}
      style={{
        writingMode: "vertical-rl",
        transform: `translateY(-50%) rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
}
