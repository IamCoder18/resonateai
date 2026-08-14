"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, FileAudio, X, Plus } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { apiUrl } from "@/lib/api-base";
import { Crosshair } from "@/components/brand";

export interface UploadedFile {
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
  onUploaded: (files: UploadedFile[]) => void;
}

interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

export function UploadDropzone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        const uploaded: UploadedFile[] = result.files
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
    uploadAll(newItems);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    enqueueFiles(files);
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    enqueueFiles(files);
    e.target.value = "";
  }

  function removeItem(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function clearDone() {
    setQueue((prev) => prev.filter((q) => q.status === "uploading"));
  }

  const pending = queue.filter((q) => q.status !== "done").length;

  return (
    <div>
      <div className="relative">
        <Crosshair className="z-20 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/40" />
        <Crosshair className="z-20 right-0 top-0 translate-x-1/2 -translate-y-1/2 text-white/40" />
        <Crosshair className="z-20 left-0 bottom-0 -translate-x-1/2 translate-y-1/2 text-white/40" />
        <Crosshair className="z-20 right-0 bottom-0 translate-x-1/2 translate-y-1/2 text-white/40" />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          className={`
            group cursor-pointer border-2 border-dashed px-8 py-14 text-center transition-all
            ${
              dragging
                ? "border-accent bg-accent-10"
                : "border-white/15 bg-panel-30 hover:border-accent-40"
            }
            ${busy ? "pointer-events-none opacity-70" : ""}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="audio/*,video/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm,.aiff,.alac,.wma,.amr,.mp4,.mov,.mkv,.avi,.wmv,.flv,.3gp,.ts,.mts"
            className="hidden"
            onChange={onSelect}
          />
          <div className="flex flex-col items-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center border border-line bg-panel-40 text-accent">
              {busy ? (
                <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
              ) : (
                <Upload className="h-6 w-6" strokeWidth={1.5} />
              )}
            </div>
            <div className="font-serif text-[1.4rem] leading-tight text-bone">
              {busy
                ? `Uploading ${pending} file${pending === 1 ? "" : "s"}…`
                : "Drop a file here"}
            </div>
            <div className="mt-2 font-mono text-[0.85rem] text-steel-70">
              {busy
                ? "Stay on this page."
                : "or click to browse — MP3, WAV, FLAC, M4A, AAC, AIFF, OGG, MP4 or MOV"}
            </div>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="mt-4 border border-line bg-panel-30">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-70">
            <div>
              {queue.length} file{queue.length === 1 ? "" : "s"} ·{" "}
              {queue.filter((q) => q.status === "done").length} done
            </div>
            {queue.some((q) => q.status === "done") && !busy && (
              <button
                onClick={clearDone}
                className="hover:text-bone transition-colors"
              >
                Clear finished
              </button>
            )}
          </div>
          {queue.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
            >
              <FileAudio className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[0.85rem] text-bone-80">
                  {q.file.name}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-white/5">
                    <div
                      className={`h-full transition-all ${
                        q.status === "error"
                          ? "bg-accent"
                          : "bg-accent"
                      }`}
                      style={{
                        width: `${q.progress}%`,
                        boxShadow:
                          q.status === "uploading"
                            ? "0 0 8px rgba(255,122,26,0.5)"
                            : "none",
                      }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right font-mono text-[0.7rem] text-steel-70">
                    {q.status === "done"
                      ? "Converted"
                      : q.status === "error"
                        ? q.error || "Failed"
                        : `${q.progress}%`}
                  </span>
                </div>
              </div>
              {q.status === "done" ? (
                <span className="shrink-0 font-mono text-[0.7rem] text-accent">
                  {formatBytes(q.file.size)}
                </span>
              ) : q.status === "error" ? (
                <span className="shrink-0 font-mono text-[0.7rem] text-accent">
                  Error
                </span>
              ) : (
                <span className="shrink-0 font-mono text-[0.7rem] text-steel-70">
                  {formatBytes(q.file.size)}
                </span>
              )}
              {!busy && (
                <button
                  onClick={() => removeItem(q.id)}
                  className="shrink-0 text-steel-70 hover:text-bone"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {!busy && (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-steel-70 transition-colors hover:bg-white/2 hover:text-bone"
            >
              <Plus className="h-3.5 w-3.5" />
              Add more
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 font-mono text-[0.78rem] text-steel-70">
        <FileAudio className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
        <span>
          Cleaned copy arrives by email when it's ready — usually{" "}
          <span className="text-accent">a day or two</span>.
        </span>
      </div>
    </div>
  );
}
