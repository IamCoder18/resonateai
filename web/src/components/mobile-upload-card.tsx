"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Loader2,
  FileAudio,
  X,
  Plus,
  Music,
  Video,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { apiUrl } from "@/lib/api-base";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { isNativePlatform } from "@/lib/capacitor-runtime";

export interface MobileUploadedFile {
  id: string;
  filename: string;
  convertedFilename?: string;
  sizeBytes: number;
  convertedSizeBytes?: number;
  status: string;
  uploadedAt: string;
  error?: string;
}

interface Props {
  onUploaded: (files: MobileUploadedFile[]) => void;
}

interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

const AUDIO_EXT = "audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.aiff,.alac,.wma,.amr";
const VIDEO_EXT = "video/*,.mp4,.mov,.mkv,.webm,.avi,.wmv,.flv,.3gp,.ts,.mts";

export function MobileUploadCard({ onUploaded }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const native = isNativePlatform();

  const tap = useCallback(async () => {
    try {
      if (native) await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      /* haptics not available */
    }
  }, [native]);

  const uploadAll = useCallback(
    async (items: QueueItem[]) => {
      setBusy(true);
      const fd = new FormData();
      items.forEach((it) => fd.append("file", it.file));

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        setQueue((prev) =>
          prev.map((q) =>
            items.some((i) => i.id === q.id) ? { ...q, progress: pct } : q,
          ),
        );
      });

      const promise = new Promise<{
        files: Array<{
          id: string;
          originalFilename: string;
          convertedFilename: string;
          originalSizeBytes: number;
          convertedSizeBytes: number;
          status: string;
          error?: string;
        }>;
      }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", apiUrl("/api/upload"));
        xhr.send(fd);
      });

      try {
        const result = await promise;
        const uploaded: MobileUploadedFile[] = result.files
          .filter((f) => f.status === "processing")
          .map((f) => ({
            id: f.id,
            filename: f.originalFilename,
            convertedFilename: f.convertedFilename,
            sizeBytes: f.originalSizeBytes,
            convertedSizeBytes: f.convertedSizeBytes,
            status: f.status,
            uploadedAt: new Date().toISOString(),
          }));
        setQueue((prev) =>
          prev.map((q) => {
            const match = result.files.find((r) => r.originalFilename === q.file.name);
            if (!match) return q;
            return {
              ...q,
              status: match.status === "processing" ? "done" : "error",
              error: match.error,
              progress: 100,
            };
          }),
        );
        if (uploaded.length > 0) onUploaded(uploaded);
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            items.some((i) => i.id === q.id)
              ? { ...q, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : q,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [onUploaded],
  );

  function enqueueFiles(files: File[]) {
    if (files.length === 0) return;
    const newItems: QueueItem[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      status: "pending",
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newItems]);
    void uploadAll(newItems);
  }

  function onAudioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    enqueueFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }
  function onVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    enqueueFiles(Array.from(e.target.files || []));
    e.target.value = "";
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function clearDone() {
    setQueue((prev) => prev.filter((q) => q.status === "uploading"));
  }

  return (
    <div>
      <div className="relative border-2 border-dashed border-white/15 bg-panel-30 px-6 py-10 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center border border-line bg-panel-40 text-accent">
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
            ) : (
              <Upload className="h-6 w-6" strokeWidth={1.5} />
            )}
          </div>
          <div className="font-serif text-[1.3rem] leading-tight text-bone">
            {busy ? "Uploading…" : "Upload a file"}
          </div>
          <div className="mt-1 font-mono text-[0.78rem] text-steel-70">
            {busy
              ? "Stay on this screen."
              : "Audio or video, up to 500 MB each."}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              void tap();
              audioRef.current?.click();
            }}
            disabled={busy}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 bg-accent font-mono text-[0.82rem] uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-accent-dim disabled:opacity-50"
          >
            <Music className="h-4 w-4" strokeWidth={1.5} />
            Pick audio
          </button>
          <button
            type="button"
            onClick={() => {
              void tap();
              videoRef.current?.click();
            }}
            disabled={busy}
            className="group relative inline-flex h-12 w-full items-center justify-center gap-2 border border-white/20 font-mono text-[0.82rem] uppercase tracking-[0.16em] text-bone transition-colors hover:border-white/40 disabled:opacity-50"
          >
            <Video className="h-4 w-4" strokeWidth={1.5} />
            Pick video
          </button>
        </div>

        <input
          ref={audioRef}
          type="file"
          multiple
          accept={AUDIO_EXT}
          onChange={onAudioSelect}
          className="hidden"
        />
        <input
          ref={videoRef}
          type="file"
          multiple
          accept={VIDEO_EXT}
          onChange={onVideoSelect}
          className="hidden"
        />
      </div>

      {queue.length > 0 && (
        <div className="mt-4 border border-line bg-panel-30">
          <div className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel-70">
            <div>
              {queue.length} file{queue.length === 1 ? "" : "s"} ·{" "}
              {queue.filter((q) => q.status === "done").length} done
            </div>
            {queue.some((q) => q.status === "done") && !busy && (
              <button
                onClick={clearDone}
                className="text-steel-70 transition-colors hover:text-bone"
              >
                Clear finished
              </button>
            )}
          </div>
          {queue.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-b-0"
            >
              <FileAudio
                className="h-4 w-4 shrink-0 text-accent"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[0.82rem] text-bone-80">
                  {q.file.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/5">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${q.progress}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-[0.66rem] text-steel-70">
                    {q.status === "done"
                      ? "Converted"
                      : q.status === "error"
                        ? "Failed"
                        : `${q.progress}%`}
                  </span>
                </div>
                {q.status === "error" && q.error && (
                  <div className="mt-1 truncate font-mono text-[0.66rem] text-accent">
                    {q.error}
                  </div>
                )}
              </div>
              <span className="shrink-0 font-mono text-[0.66rem] text-steel-70">
                {formatBytes(q.file.size)}
              </span>
              {!busy && (
                <button
                  onClick={() => removeItem(q.id)}
                  aria-label="Remove"
                  className="shrink-0 text-steel-70 hover:text-bone"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {!busy && (
            <button
              onClick={() => audioRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 px-4 py-2 font-mono text-[0.74rem] uppercase tracking-[0.16em] text-steel-70 transition-colors hover:bg-white/2 hover:text-bone"
            >
              <Plus className="h-3.5 w-3.5" />
              Add more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
