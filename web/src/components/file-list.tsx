"use client";

import { useState } from "react";
import { FileAudio, Loader2, Download } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { apiUrl } from "@/lib/api-base";
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
      const res = await fetch(apiUrl(`/api/files/${fileId}/sign`), {
        method: "POST",
        credentials: "include",
      });
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
      <div className="border border-line bg-panel-30 p-10 text-center sm:p-12">
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
      <ul className="divide-y divide-line">
        {files.map((f) => (
          <FileRow
            key={f.id}
            file={f}
            downloading={downloading === f.id}
            onDownload={() => downloadCleaned(f.id)}
          />
        ))}
      </ul>
    </div>
  );
}

interface FileRowProps {
  file: FileRecord;
  downloading: boolean;
  onDownload: () => void;
}

function FileRow({ file: f, downloading, onDownload }: FileRowProps) {
  const isReady = f.status === "ready" && !!f.cleanedFilename;

  return (
    <li className="group p-4 transition-colors hover:bg-white/2 sm:p-5">
      {/* Row 1: icon + filename + status badge */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-panel-40 text-accent sm:h-11 sm:w-11">
          <FileAudio className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 font-serif text-[1.05rem] leading-tight text-bone">
              <span className="break-all sm:truncate sm:break-normal">
                {f.filename}
              </span>
            </div>
            <div className="shrink-0 pt-0.5">
              <StatusBadge status={f.status} />
            </div>
          </div>

          {/* Row 2: meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.78rem] text-steel-70">
            <span>{formatBytes(f.sizeBytes)}</span>
            <span className="text-steel-55">·</span>
            <span>{formatDate(f.uploadedAt)}</span>
            {f.cleanedSizeBytes ? (
              <>
                <span className="text-steel-55">·</span>
                <span className="text-bone-70">
                  {formatBytes(f.cleanedSizeBytes)} cleaned
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Row 3: full-width download CTA (mobile), inline button (desktop) */}
      {isReady && (
        <div className="mt-3 sm:mt-3">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="group/btn relative inline-flex h-11 w-full items-center justify-center gap-2 border border-accent-40 bg-accent-10 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent-20 disabled:opacity-50 sm:h-9 sm:w-auto sm:px-4"
          >
            <CornerTicksCanvas />
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" strokeWidth={1.5} />
            )}
            <span>Download cleaned</span>
          </button>
        </div>
      )}
    </li>
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
