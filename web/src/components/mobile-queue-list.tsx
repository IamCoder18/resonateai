"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, FileAudio } from "lucide-react";
import { FileList } from "@/components/file-list";
import type { FileRecord } from "@/components/file-list";
import { apiUrl } from "@/lib/api-base";

const POLL_INTERVAL_MS = 30_000;
const PULL_THRESHOLD = 90;

export function MobileQueueList() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullStart = useRef<number | null>(null);
  const lastUpdated = useRef<Date | null>(null);
  const [, force] = useState(0);

  async function load(initial = false) {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/files"));
      if (res.status === 401) {
        setFiles([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to load files");
      const data = (await res.json()) as { files?: FileRecord[] };
      setFiles(data.files ?? []);
      lastUpdated.current = new Date();
      force((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPulling(false);
      setPullDistance(0);
    }
  }

  useEffect(() => {
    void load(true);
  }, []);

  useEffect(() => {
    const hasProcessing = files.some((f) => f.status === "processing");
    if (!hasProcessing) return;
    const t = window.setInterval(() => {
      void load(false);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [files]);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY <= 0) {
      pullStart.current = e.touches[0]?.clientY ?? null;
    } else {
      pullStart.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (pullStart.current === null) return;
    const y = e.touches[0]?.clientY ?? 0;
    const d = Math.max(0, y - pullStart.current);
    if (d > 0 && d < 200) {
      setPulling(true);
      setPullDistance(d * 0.5);
    }
  }

  function onTouchEnd() {
    if (pullStart.current === null) return;
    if (pullDistance > PULL_THRESHOLD) {
      void load(false);
    } else {
      setPulling(false);
      setPullDistance(0);
    }
    pullStart.current = null;
  }

  const readyCount = files.filter((f) => f.status === "ready").length;
  const processingCount = files.filter((f) => f.status === "processing").length;

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* pull indicator */}
      {pulling && (
        <div
          className="pointer-events-none flex items-center justify-center transition-opacity"
          style={{
            height: `${Math.max(28, pullDistance)}px`,
            opacity: Math.min(1, pullDistance / PULL_THRESHOLD),
          }}
        >
          <RefreshCw
            className="h-4 w-4 text-accent"
            strokeWidth={1.5}
            style={{
              transform: `rotate(${Math.min(180, pullDistance * 2)}deg)`,
            }}
          />
        </div>
      )}

      {/* header */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
            Queue
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-[1.6rem] leading-none text-bone">
              {files.length}
            </span>
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-70">
              {files.length === 1 ? "file" : "files"}
              {processingCount > 0 && (
                <span className="ml-2 text-accent">
                  · {processingCount} processing
                </span>
              )}
            </span>
          </div>
        </div>
        <button
          onClick={() => void load(false)}
          disabled={refreshing}
          aria-label="Refresh"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-canvas text-steel-70 transition-colors hover:border-white/30 hover:text-bone disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {error && (
        <div className="mb-3 border border-line bg-panel-30 px-3 py-2 font-mono text-[0.78rem] text-accent">
          ! {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 border border-line bg-panel-30 py-16 font-mono text-[0.85rem] text-steel-70">
          Loading…
        </div>
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FileList files={files} />
          {readyCount > 0 && (
            <div className="mt-3 text-center font-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel-55">
              {readyCount} ready to download
            </div>
          )}
        </>
      )}

      {lastUpdated.current && !loading && (
        <div className="mt-4 text-center font-mono text-[0.6rem] uppercase tracking-[0.18em] text-steel-55">
          Updated {formatRelative(lastUpdated.current)}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-line bg-panel-30 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-line bg-panel-40 text-accent">
        <FileAudio className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div className="font-serif text-[1.2rem] text-bone">No files yet.</div>
      <div className="mt-2 font-mono text-[0.85rem] text-steel-70">
        Upload one from the Upload tab.
      </div>
    </div>
  );
}

function formatRelative(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
