"use client";

import { CSSProperties } from "react";

/* ===========================================================================
   HeroScope — the folder upload animation, rebuilt from scratch.

   Brand palette (from globals.css):
     canvas  #0a0907   bone    #f4f1ea   steel   #9a948a
     panel   #14110d   accent  #ff7a1a   accent-dim #d4600f
   ======================================================================== */

const ACCENT = "#ff7a1a";
const STEEL = "#9a948a";
const BONE = "#f4f1ea";
const LINE = "rgba(255,255,255,0.14)";

/* ------------------------------------------------------------------------
   Floating file chips — the accepted formats queued around the folder.
   ------------------------------------------------------------------------ */
type Chip = {
  label: string;
  left: number;
  top: number;
  rot: number;
  d: string;
};

const CHIPS: Chip[] = [
  { label: "MP3", left: 14, top: 92, rot: -6, d: "0s" },
  { label: "FLAC", left: 6, top: 184, rot: -10, d: "0.9s" },
  { label: "WAV", left: 366, top: 96, rot: 5, d: "1.7s" },
  { label: "M4A", left: 372, top: 188, rot: 8, d: "2.5s" },
  { label: "MP4", left: 156, top: 14, rot: -3, d: "0.4s" },
  { label: "OGG", left: 300, top: 14, rot: 4, d: "1.3s" },
];

function ChipGlyph() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
      <path
        d="M1 8 V4 M4 9.5 V1 M7 8.5 V2.5 M10 9 V3"
        stroke={ACCENT}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileChip({ chip }: { chip: Chip }) {
  const vars = {
    "--d": chip.d,
    "--rot": `${chip.rot}deg`,
  } as CSSProperties;

  return (
    <span
      className="rs-chip"
      style={{ left: chip.left, top: chip.top, ...vars }}
    >
      <span className="rs-chip-inner">
        <ChipGlyph />
        {chip.label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------------
   Folder — dark panel with an accent tab, an animated equalizer, and a
   scan beam sweeping down through the body.
   ------------------------------------------------------------------------ */
function FolderSvg() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 240 150"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="rs-folder-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e1712" />
          <stop offset="1" stopColor="#110e0b" />
        </linearGradient>
      </defs>
      <path
        d="M0 24 L0 132 Q0 148 16 148 L224 148 Q240 148 240 132 L240 24 Z"
        fill="url(#rs-folder-grad)"
        stroke={LINE}
        strokeWidth="1.5"
      />
      <path d="M0 6 H104 L118 24 H0 Z" fill={ACCENT} />
      <path d="M0 24 H118" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
      <path
        d="M20 128 h4 l6 -10 l6 14 l6 -16 l6 18 l6 -12 l6 10 l6 -6 h4"
        stroke="rgba(154,148,138,0.4)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const EQ_BARS = Array.from({ length: 24 }, (_, i) => ({
  h: Math.round(14 + Math.abs(Math.sin(i * 0.62) * 20 + Math.cos(i * 0.31) * 8)),
  delay: `${(i * 0.06).toFixed(2)}s`,
  color: i % 3 === 2 ? STEEL : ACCENT,
}));

function Equalizer() {
  return (
    <div className="rs-eq" style={{ left: 24, right: 24, top: 56, height: 62 }}>
      {EQ_BARS.map((bar, i) => (
        <span
          key={i}
          className="rs-bar"
          style={{
            height: bar.h,
            animationDelay: bar.delay,
            background: bar.color,
          }}
        />
      ))}
    </div>
  );
}

function ScanBeam() {
  return (
    <div className="rs-scan" style={{ left: 22, right: 22, top: 54, height: 66 }}>
      <span className="rs-scanline" />
    </div>
  );
}

/* ------------------------------------------------------------------------
   Submissions card — dark themed status list.
   ------------------------------------------------------------------------ */
const SUBMISSIONS = [
  { name: "Lead vocal.mp3", status: "In progress", active: true },
  { name: "Guitar take.wav", status: "Cleaned", active: false },
  { name: "Demo loop.mp4", status: "Cleaned", active: false },
];

function EngineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect
        x="5.5"
        y="5.5"
        width="9"
        height="9"
        rx="2"
        stroke={ACCENT}
        strokeWidth="1.4"
      />
      <path
        d="M8 2.5v3M12 2.5v3M8 14.5v3M12 14.5v3M2.5 8h3M2.5 12h3M14.5 8h3M14.5 12h3"
        stroke={STEEL}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SubmissionsCard() {
  return (
    <div className="rs-card mt-3 w-full">
      <div className="flex items-center gap-4">
        <div className="hidden shrink-0 items-center justify-center md:flex">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
            <rect
              x="1"
              y="1"
              width="32"
              height="32"
              rx="9"
              fill="rgba(255,122,26,0.12)"
              stroke="rgba(255,122,26,0.35)"
            />
            <path
              d="M9 19 V15 M13 21.5 V12.5 M17 20.5 V13.5 M21 21 V13 M25 19 V15"
              stroke={ACCENT}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="rs-card-title">Submissions</p>
          <div className="mt-2 w-full">
            {SUBMISSIONS.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] py-2.5 last:border-b-0"
              >
                <span className="truncate text-[12px] font-medium text-[#f4f1ea]/90">
                  {s.name}
                </span>
                <span
                  className={
                    s.active
                      ? "rs-chip-status rs-chip-status--active"
                      : "rs-chip-status"
                  }
                >
                  {s.active ? (
                    <span className="rs-dot" />
                  ) : (
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 8 8"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M1.5 4.2l1.7 1.7 3.3-3.6"
                        stroke="#4ade80"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {s.status}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-[rgba(255,255,255,0.06)] pt-3 text-[11px] font-medium text-[#9a948a]">
            Back in 24–48 h
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   HeroScope
   ======================================================================== */
export function HeroScope() {
  return (
    <div
      role="img"
      aria-label="Audio files flowing into the Resonate engine and out as a clean master"
      className="rs-cluster mx-auto flex w-full max-w-[520px] flex-col items-center"
    >
      <div className="rs-canvas relative" style={{ width: 460, height: 300 }}>
        <div className="rs-glow" style={{ left: 110, top: 80, width: 240, height: 150 }} />

        <div
          className="rs-folder absolute"
          style={{ left: 110, top: 80, width: 240, height: 150 }}
        >
          <FolderSvg />
          <Equalizer />
          <ScanBeam />
        </div>

        {CHIPS.map((chip) => (
          <FileChip key={chip.label} chip={chip} />
        ))}
      </div>

      <p className="rs-label mt-1">Audio package</p>
      <span className="rs-conn my-2.5" aria-hidden="true" />
      <span className="rs-pill">
        <EngineIcon />
        Resonate Audio Engine
      </span>
      <p className="rs-caption mt-2">The engine cleans &amp; masters everything</p>
      <span className="rs-conn mt-2.5" aria-hidden="true" />

      <SubmissionsCard />

      <style>{`
        .rs-cluster { --bone: ${BONE}; }

        /* Folder */
        .rs-folder { animation: rs-float 7s ease-in-out infinite; will-change: transform; }
        @keyframes rs-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .rs-glow {
          position: absolute;
          border-radius: 20px;
          background: radial-gradient(ellipse at 50% 60%, rgba(255,122,26,0.18), transparent 70%);
          animation: rs-glow 6s ease-in-out infinite;
        }
        @keyframes rs-glow {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }

        /* Equalizer */
        .rs-eq {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .rs-bar {
          width: 4px;
          border-radius: 999px;
          transform-origin: center;
          animation: rs-eq 1.3s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes rs-eq {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }

        /* Scan beam */
        .rs-scan { position: absolute; overflow: hidden; border-radius: 8px; }
        .rs-scanline {
          position: absolute;
          left: 0;
          right: 0;
          top: -4px;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(255,122,26,0.85), transparent);
          filter: drop-shadow(0 0 8px rgba(255,122,26,0.6));
          animation: rs-scan 3.2s linear infinite;
          will-change: transform;
        }
        @keyframes rs-scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(72px); }
        }

        /* Floating file chips */
        .rs-chip {
          position: absolute;
          animation: rs-bob 5.5s ease-in-out infinite;
          animation-delay: var(--d, 0s);
          will-change: transform;
        }
        .rs-chip-inner {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          border-radius: 11px;
          border: 1px solid ${LINE};
          background: linear-gradient(180deg, #1d1712, #120f0c);
          color: ${BONE};
          box-shadow: 0 10px 24px -18px rgba(0,0,0,0.9);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        @keyframes rs-bob {
          0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          50% { transform: translateY(-9px) rotate(var(--rot, 0deg)); }
        }

        /* Labels / connectors / pill */
        .rs-label {
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          line-height: 1;
          color: ${STEEL};
        }
        .rs-conn {
          display: block;
          width: 1.5px;
          height: 22px;
          border-radius: 2px;
          background: linear-gradient(rgba(244,241,234,0.04), rgba(255,122,26,0.28) 50%, rgba(244,241,234,0.04));
        }
        .rs-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid ${LINE};
          background: #14110d;
          color: ${BONE};
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          font-size: 13px;
          font-weight: 500;
        }
        .rs-caption {
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
          color: ${STEEL};
        }

        /* Submissions card */
        .rs-card {
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #120f0c;
          padding: 18px 20px;
          box-shadow: 0 18px 44px -30px rgba(0,0,0,0.8);
        }
        .rs-card-title {
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          color: ${BONE};
        }
        .rs-chip-status {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 6px;
          border-radius: 6px;
          padding: 3px 7px;
          font-size: 10px;
          font-weight: 500;
          color: #4ade80;
          background: rgba(74,222,128,0.12);
        }
        .rs-chip-status--active {
          color: ${ACCENT};
          background: rgba(255,122,26,0.14);
        }
        .rs-dot {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: ${ACCENT};
          animation: rs-pulse 2.4s ease-in-out infinite;
        }
        @keyframes rs-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rs-folder, .rs-glow, .rs-bar, .rs-scanline, .rs-chip, .rs-dot { animation: none !important; }
        }
        @media (max-width: 520px) {
          .rs-canvas { transform: scale(0.78); transform-origin: top center; margin-bottom: -66px; }
        }
      `}</style>
    </div>
  );
}
