"use client";

import { useState } from "react";
import { FileAudio, Music, Loader2, Download } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export interface FileRecord {
  id: string;
  filename: string;
  convertedFilename?: string;
  cleanedFilename?: string | null;
  mimeType: string;
  convertedMimeType?: string;
  cleanedSizeBytes?: number | null;
  sizeBytes: number;
  convertedSizeBytes?: number;
  status: string;
  uploadedAt: string;
}

interface Props {
  files: FileRecord[];
}

export function FileList({ files }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function downloadCleaned(fileId: string) {
    setDownloading(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/sign`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Sign failed");
      }
      window.open(data.url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  if (files.length === 0) {
    return (
      <div className="border border-line bg-panel-30 p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-line bg-panel-40 text-accent">
          <FileAudio className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div className="font-serif text-[1.2rem] text-bone">No files yet.</div>
        <div className="mt-2 font-mono text-[0.85rem] text-steel-70">
          Drop one above.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-line">
      {error && (
        <div className="border-b border-line bg-panel-30 px-4 py-2 font-mono text-[0.78rem] text-accent">
          ! {error}
        </div>
      )}
      {files.map((f) => (
        <div
          key={f.id}
          className="flex items-center gap-4 border-b border-line p-4 transition-colors last:border-b-0 hover:bg-white/2"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-panel-40 text-accent">
            <FileAudio className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-serif text-[1.1rem] text-bone">
              {f.filename}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[0.78rem] text-steel-70">
              <span>{formatBytes(f.sizeBytes)}</span>
              <span className="text-steel-55">·</span>
              <span>{formatDate(f.uploadedAt)}</span>
              {f.convertedFilename && (
                <>
                  <span className="text-steel-55">·</span>
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Music className="h-3 w-3" strokeWidth={1.5} />
                    {f.convertedFilename}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {f.status === "ready" && f.cleanedFilename && (
              <button
                onClick={() => downloadCleaned(f.id)}
                disabled={downloading === f.id}
                className="group relative inline-flex h-8 items-center gap-1.5 border border-accent-40 bg-accent-10 px-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent-20 disabled:opacity-50"
              >
                <CornerTicksCanvas />
                {downloading === f.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                Download
              </button>
            )}
            <StatusBadge status={f.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CornerTicksCanvas() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 text-accent/50">
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
