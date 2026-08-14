"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Loader2,
  Download,
  Upload,
  CheckCircle2,
  X,
  User as UserIcon,
  Mail,
  Inbox,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { formatBytes, formatDate, cn } from "@/lib/utils";
import { UploadDropzone } from "@/components/upload-dropzone";
import type { UploadedFile } from "@/components/upload-dropzone";
import { StatusBadge } from "@/components/status-badge";
import {
  Kicker,
  HudBadge,
  LogoLockup,
  Crosshair,
} from "@/components/brand";

interface Submission {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  filename: string;
  convertedFilename: string;
  mimeType: string;
  convertedMimeType: string;
  sizeBytes: number;
  convertedSizeBytes: number;
  cleanedFilename: string | null;
  cleanedMimeType: string | null;
  cleanedSizeBytes: number | null;
  status: string;
  uploadedAt: string;
  finishedAt: string | null;
}

interface Props {
  user: { id: string; name: string; email: string };
}

type Filter = "all" | "processing" | "ready" | "failed";

export function AdminDashboard({ user }: Props) {
  const router = useRouter();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [uploadCount, setUploadCount] = useState<number | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  function onUploaded(files: UploadedFile[]) {
    setUploadCount(files.length);
    setTimeout(() => setUploadCount(null), 8000);
    load();
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setSubs(data.files || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  function showToast(kind: "ok" | "err", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 6000);
  }

  async function getSignedUrl(fileId: string, kind: "original" | "converted" | "cleaned") {
    const res = await fetch("/api/admin/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, kind }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "sign failed");
    }
    const data = await res.json();
    return data.url as string;
  }

  async function downloadFile(fileId: string, kind: "original" | "converted" | "cleaned") {
    try {
      const url = await getSignedUrl(fileId, kind);
      window.open(url, "_blank");
    } catch (err) {
      showToast("err", err instanceof Error ? err.message : "Download failed");
    }
  }

  async function finishSubmission(fileId: string) {
    const input = fileInputs.current[fileId];
    if (!input || !input.files || input.files.length === 0) {
      showToast("err", "Pick a cleaned audio file first");
      return;
    }
    const file = input.files[0];
    setBusy(fileId);
    try {
      const fd = new FormData();
      fd.append("fileId", fileId);
      fd.append("cleanedFile", file);
      const res = await fetch("/api/admin/finish", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "finish failed");
      const emailResults: Array<{ userEmail: string; ok: boolean; error?: string }> = data.emails || [];
      const ok = emailResults.every((e) => e.ok);
      const fail = emailResults.find((e) => !e.ok);
      if (ok) {
        showToast("ok", `Sent to ${emailResults[0]?.userEmail || "user"}.`);
      } else {
        showToast("err", `Sent but email failed: ${fail?.error || "unknown"}`);
      }
      await load();
    } catch (err) {
      showToast("err", err instanceof Error ? err.message : "Finish failed");
    } finally {
      setBusy(null);
    }
  }

  const filtered = subs.filter((s) => filter === "all" || s.status === filter);
  const totalCount = subs.length;
  const processingCount = subs.filter((s) => s.status === "processing").length;
  const readyCount = subs.filter((s) => s.status === "ready").length;
  const failedCount = subs.filter((s) => s.status === "failed" || s.status === "rejected").length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-shell items-center justify-between px-6 sm:px-10 lg:px-[72px]">
          <Link href="/" className="flex items-center gap-3">
            <LogoLockup />
            <HudBadge tone="accent">Admin</HudBadge>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[0.78rem] tracking-[0.1em] text-steel-70 sm:inline">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="group relative inline-flex h-10 items-center gap-2 border border-white/15 px-4 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-bone-80 transition-colors hover:border-white/40 hover:text-bone"
            >
              <CornerTicksLight />
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-shell px-6 py-10 sm:px-10 lg:px-[72px]">
        <div className="mb-10">
          <Kicker tone="accent">Admin</Kicker>
          <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.04] text-bone sm:text-[3rem]">
            Submissions.
          </h1>
          <p className="mt-4 max-w-[640px] font-mono text-[0.95rem] leading-[1.65] text-bone-70">
            Pick up a submission. Attach the cleaned file. Send.
          </p>
        </div>

        {uploadCount !== null && (
          <div className="relative mb-8 border border-accent-40 bg-accent-10 p-5">
            <Crosshair className="z-10 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/40" />
            <Crosshair className="z-10 right-0 top-0 translate-x-1/2 -translate-y-1/2 text-white/40" />
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-accent-40 bg-accent-20 text-accent">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="font-serif text-[1.25rem] text-bone">
                  {uploadCount} file{uploadCount === 1 ? "" : "s"} uploaded
                </div>
                <div className="mt-1 font-mono text-[0.85rem] text-bone-70">
                  Attach the cleaned file and click <span className="text-accent">Send</span> to email the user.
                </div>
              </div>
              <button
                onClick={() => setUploadCount(null)}
                className="text-steel-70 hover:text-bone"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-10">
          <UploadDropzone onUploaded={onUploaded} />
        </div>

        <div className="mb-8 grid gap-px border border-line bg-line lg:grid-cols-4">
          <Stat label="All" value={totalCount} />
          <Stat label="In progress" value={processingCount} tone="accent" />
          <Stat label="Ready" value={readyCount} />
          <Stat label="Failed" value={failedCount} />
        </div>

        <div className="mb-6 flex items-center gap-2">
          {(["all", "processing", "ready", "failed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "group relative inline-flex h-9 items-center border px-4 font-mono text-[0.72rem] uppercase tracking-[0.16em] transition-colors",
                filter === f
                  ? "border-accent bg-accent text-canvas"
                  : "border-white/15 text-bone-80 hover:border-white/40 hover:text-bone",
              )}
            >
              {filter === f && <CornerTicksCanvas />}
              <span className="relative">
                {f === "all"
                  ? "All"
                  : f === "processing"
                    ? "In progress"
                    : f === "ready"
                      ? "Ready"
                      : "Failed"}
              </span>
            </button>
          ))}
        </div>

        {toast && (
          <div
            className={cn(
              "mb-4 border p-3 font-mono text-[0.85rem]",
              toast.kind === "ok"
                ? "border-accent-40 bg-accent-10 text-accent"
                : "border-line bg-panel-30 text-bone-80",
            )}
          >
            <div className="flex items-center gap-3">
              {toast.kind === "ok" ? (
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <X className="h-4 w-4" strokeWidth={1.5} />
              )}
              <span className="flex-1">{toast.msg}</span>
              <button onClick={() => setToast(null)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 border border-line bg-panel-30 py-16 font-mono text-[0.85rem] text-steel-70">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line bg-panel-30 p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-line bg-panel-40 text-accent">
              <Inbox className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div className="font-serif text-[1.2rem] text-bone">Queue is empty.</div>
            <div className="mt-2 font-mono text-[0.85rem] text-steel-70">
              {filter === "all"
                ? "No uploads yet."
                : `Nothing matches this filter.`}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => (
              <SubmissionRow
                key={s.id}
                s={s}
                isBusy={busy === s.id}
                onDownload={downloadFile}
                onFinish={finishSubmission}
                registerInput={(el) => (fileInputs.current[s.id] = el)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "accent";
}) {
  return (
    <div className="bg-canvas p-6">
      <div className="mb-4 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
        {label}
      </div>
      <div
        className={cn(
          "font-serif text-[2rem] leading-tight",
          tone === "accent" ? "text-accent" : "text-bone",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SubmissionRow({
  s,
  isBusy,
  onDownload,
  onFinish,
  registerInput,
}: {
  s: Submission;
  isBusy: boolean;
  onDownload: (id: string, kind: "original" | "converted" | "cleaned") => void;
  onFinish: (id: string) => void;
  registerInput: (el: HTMLInputElement | null) => void;
}) {
  const isReady = s.status === "ready";
  return (
    <div className="relative border border-line bg-panel-30 p-6">
      <Crosshair className="z-10 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/30" />
      <Crosshair className="z-10 right-0 top-0 translate-x-1/2 -translate-y-1/2 text-white/30" />
      <Crosshair className="z-10 left-0 bottom-0 -translate-x-1/2 translate-y-1/2 text-white/30" />
      <Crosshair className="z-10 right-0 bottom-0 translate-x-1/2 translate-y-1/2 text-white/30" />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="truncate font-serif text-[1.2rem] text-bone">
              {s.filename}
            </span>
            <StatusBadge status={s.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.78rem] text-steel-70">
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3 w-3" strokeWidth={1.5} /> {s.userName}
            </span>
            <span className="text-steel-55">·</span>
            <a
              href={`mailto:${s.userEmail}`}
              className="inline-flex items-center gap-1 hover:text-accent"
            >
              <Mail className="h-3 w-3" strokeWidth={1.5} /> {s.userEmail}
            </a>
            <span className="text-steel-55">·</span>
            <span>uploaded {formatDate(s.uploadedAt)}</span>
            {isReady && s.finishedAt && (
              <>
                <span className="text-steel-55">·</span>
                <span>finished {formatDate(s.finishedAt)}</span>
              </>
            )}
          </div>
          <div className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-55">
            {formatBytes(s.sizeBytes)} → {formatBytes(s.convertedSizeBytes)} MP3
            {s.cleanedSizeBytes && ` → ${formatBytes(s.cleanedSizeBytes)} cleaned`}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <CornerButtonAsButton
          onClick={() => onDownload(s.id, "original")}
          variant="ghost"
          size="sm"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          Original
        </CornerButtonAsButton>
        <CornerButtonAsButton
          onClick={() => onDownload(s.id, "converted")}
          variant="ghost"
          size="sm"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          Converted MP3
        </CornerButtonAsButton>
        {s.cleanedFilename && (
          <CornerButtonAsButton
            onClick={() => onDownload(s.id, "cleaned")}
            variant="ghost"
            size="sm"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Cleaned MP3
          </CornerButtonAsButton>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="mb-2 block font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
            Cleaned file
            {s.cleanedFilename && (
              <span className="ml-2 text-accent">
                · current: {s.cleanedFilename}
              </span>
            )}
          </span>
          <input
            ref={registerInput}
            type="file"
            accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.aiff"
            className="block w-full cursor-pointer border border-white/15 bg-canvas px-3 py-2 font-mono text-[0.78rem] text-bone-80 file:mr-3 file:border-0 file:bg-panel-50 file:px-3 file:py-1.5 file:font-mono file:text-[0.7rem] file:uppercase file:tracking-[0.18em] file:text-bone-80 hover:border-accent-40 file:cursor-pointer"
          />
        </label>
        <button
          onClick={() => onFinish(s.id)}
          disabled={isBusy}
          className="group relative inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-canvas transition-colors hover:bg-accent-dim disabled:opacity-50 sm:self-end"
        >
          <CornerTicksCanvas />
          <span className="relative inline-flex items-center gap-2">
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={1.5} />
            )}
            {isBusy ? "Sending..." : isReady ? "Replace and send" : "Send cleaned file"}
          </span>
        </button>
      </div>
    </div>
  );
}

function CornerTicksLight() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 text-white/40">
      <Tick classes="left-[-1px] top-[-1px] border-l border-t" />
      <Tick classes="right-[-1px] top-[-1px] border-r border-t" />
      <Tick classes="left-[-1px] bottom-[-1px] border-l border-b" />
      <Tick classes="right-[-1px] bottom-[-1px] border-r border-b" />
    </span>
  );
}
function CornerTicksCanvas() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 text-canvas/70">
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

function CornerButtonAsButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      onClick={onClick}
      className="group relative inline-flex h-9 items-center gap-1.5 border border-white/15 px-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-bone-80 transition-colors hover:border-white/40 hover:text-bone"
    >
      <CornerTicksLight />
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}
