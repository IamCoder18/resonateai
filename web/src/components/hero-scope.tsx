"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

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
type SubmissionState = "active" | "done";

type Submission = {
  name: string;
  status: string;
  state: SubmissionState;
};

const SUBMISSIONS: readonly Submission[] = [
  { name: "Lead vocal take 3.mp3", status: "Mastered", state: "done" },
  { name: "Acoustic guitar.wav", status: "Mastered", state: "done" },
  { name: "Demo loop.mp4", status: "In progress", state: "active" },
];

const ACTIVE_COUNT = SUBMISSIONS.filter((s) => s.state === "active").length;
const TOTAL_COUNT = SUBMISSIONS.length;

function EngineIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

function SubmissionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 5.5h12M3 9h12M3 12.5h8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="14.5" cy="12.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M2 5.2l2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 3.5V6l1.6 1.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubmissionsCard() {
  return (
    <div className="rs-card mt-3 w-full">
      <div className="rs-card-row">
        <span className="rs-card-icon" aria-hidden="true">
          <SubmissionsIcon />
        </span>
        <div className="rs-card-content">
          <div className="rs-card-head">
            <p className="rs-card-title">Submissions</p>
            <span className="rs-card-count">
              <span className="rs-card-count-dot" aria-hidden="true" />
              {ACTIVE_COUNT > 0
                ? `${ACTIVE_COUNT} of ${TOTAL_COUNT} processing`
                : `${TOTAL_COUNT} in queue`}
            </span>
          </div>
          <ul className="rs-submissions" aria-label="Submissions">
            {SUBMISSIONS.map((s) => (
              <li key={s.name} className="rs-submission">
                <span className="rs-submission-name" title={s.name}>
                  {s.name}
                </span>
                <span
                  className={`rs-chip-status rs-chip-status--${s.state}`}
                  aria-label={`Status: ${s.status}`}
                >
                  {s.state === "active" ? (
                    <span className="rs-dot" aria-hidden="true" />
                  ) : (
                    <CheckGlyph />
                  )}
                  <span>{s.status}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="rs-card-foot">
            <ClockGlyph />
            <span>Avg. turnaround under 24 h</span>
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      setScale(Math.min(1, el.clientWidth / 460));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      role="img"
      aria-label="Audio files flowing into the Resonate engine and back out as cleaned audio"
      className="rs-cluster mx-auto flex w-full max-w-[520px] flex-col items-center"
    >
      <div ref={wrapRef} className="rs-canvas-wrap relative mx-auto w-full max-w-[460px]" style={{ aspectRatio: "460 / 300" }}>
      <div className="rs-canvas absolute inset-0" style={{ width: 460, height: 300, transform: `scale(${scale})`, transformOrigin: "top left" }}>
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
      </div>

      <p className="rs-label mt-1">Audio package</p>
      <span className="rs-conn my-2.5" aria-hidden="true" />
      <span className="rs-pill">
        <EngineIcon />
        Resonate Audio Engine
      </span>
      <p className="rs-caption mt-2">The engine handles the cleanup</p>
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
          background: linear-gradient(180deg, #14110d, #100d0a);
          padding: 16px 18px;
          box-shadow: 0 18px 44px -30px rgba(0,0,0,0.8);
          animation: rs-card-in 0.7s ease-out 0.35s backwards;
          will-change: transform, opacity;
        }
        @keyframes rs-card-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rs-card-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 14px;
          align-items: flex-start;
        }

        .rs-card-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: rgba(255, 122, 26, 0.1);
          border: 1px solid rgba(255, 122, 26, 0.22);
          color: ${ACCENT};
          flex-shrink: 0;
        }

        .rs-card-content {
          min-width: 0;
        }

        .rs-card-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 4px;
        }

        .rs-card-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1;
          color: ${BONE};
        }

        .rs-card-count {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: ${STEEL};
        }

        .rs-card-count-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: ${ACCENT};
          box-shadow: 0 0 6px rgba(255, 122, 26, 0.6);
        }

        .rs-submissions {
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .rs-submission {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .rs-submission-name {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 12px;
          font-weight: 500;
          color: ${BONE};
          opacity: 0.92;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rs-chip-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.02em;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .rs-chip-status--active {
          color: ${ACCENT};
          background: rgba(255, 122, 26, 0.14);
          border: 1px solid rgba(255, 122, 26, 0.22);
        }
        .rs-chip-status--done {
          color: #8ac4a9;
          background: rgba(138, 196, 169, 0.1);
          border: 1px solid rgba(138, 196, 169, 0.18);
        }

        .rs-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: ${ACCENT};
          box-shadow: 0 0 6px rgba(255, 122, 26, 0.6);
          animation: rs-pulse 2.4s ease-in-out infinite;
        }
        @keyframes rs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .rs-card-foot {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 6px 0 0;
          padding: 10px 0 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          font-weight: 500;
          color: ${STEEL};
        }

        @media (max-width: 767px) {
          .rs-card-row { grid-template-columns: 1fr; }
          .rs-card-icon { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rs-folder, .rs-glow, .rs-bar, .rs-scanline, .rs-chip, .rs-dot, .rs-card { animation: none !important; }
        }
        .rs-canvas-wrap {
          container-type: inline-size;
        }
      `}</style>
    </div>
  );
}
