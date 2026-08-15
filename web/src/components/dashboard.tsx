"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Upload as UploadIcon,
  Clock,
  FileAudio,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-base";
import { UploadDropzone } from "@/components/upload-dropzone";
import type { UploadedFile } from "@/components/upload-dropzone";
import { FileList } from "@/components/file-list";
import type { FileRecord } from "@/components/file-list";
import {
  Kicker,
  Crosshair,
  LogoLockup,
} from "@/components/brand";

interface Props {
  user: { id: string; name: string; email: string };
}

export function Dashboard({ user }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  async function loadFiles() {
    try {
      const res = await fetch(apiUrl("/api/files"), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  function onUploaded(uploaded: UploadedFile[]) {
    const newRecords: FileRecord[] = uploaded.map((f) => ({
      id: f.id,
      filename: f.filename,
      convertedFilename: f.convertedFilename,
      mimeType: "audio/mpeg",
      convertedMimeType: "audio/mpeg",
      sizeBytes: f.sizeBytes,
      convertedSizeBytes: f.convertedSizeBytes,
      status: f.status,
      uploadedAt: f.uploadedAt,
    }));
    setFiles((prev) => [...newRecords, ...prev]);
    setSuccessCount(newRecords.length);
    setTimeout(() => setSuccessCount(null), 10000);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-shell items-center justify-between px-6 sm:px-10 lg:px-[72px]">
          <Link href="/" className="flex items-center">
            <LogoLockup />
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
          <Kicker>Console</Kicker>
          <h1 className="mt-4 font-serif text-[2.4rem] leading-[1.04] text-bone sm:text-[3rem]">
            Console, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-[640px] font-mono text-[0.95rem] leading-[1.65] text-bone-70">
            Drop a raw file below. We'll clean it and email the result
            when it's ready.
          </p>
        </div>

        <div className="mb-10 grid gap-px border border-line bg-line lg:grid-cols-3">
          <Stat
            label="Submitted"
            value={files.length}
            icon={<UploadIcon className="h-4 w-4" strokeWidth={1.5} />}
          />
          <Stat
            label="In progress"
            value={files.filter((f) => f.status === "processing").length}
            icon={<Clock className="h-4 w-4" strokeWidth={1.5} />}
            tone="accent"
          />
          <Stat
            label="Ready"
            value={files.filter((f) => f.status === "ready").length}
            icon={<FileAudio className="h-4 w-4" strokeWidth={1.5} />}
          />
        </div>

        {successCount !== null && (
          <div className="relative mb-8 border border-accent-40 bg-accent-10 p-5">
            <Crosshair className="z-10 left-0 top-0 -translate-x-1/2 -translate-y-1/2 text-white/40" />
            <Crosshair className="z-10 right-0 top-0 translate-x-1/2 -translate-y-1/2 text-white/40" />
            <Crosshair className="z-10 left-0 bottom-0 -translate-x-1/2 translate-y-1/2 text-white/40" />
            <Crosshair className="z-10 right-0 bottom-0 translate-x-1/2 translate-y-1/2 text-white/40" />
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-accent-40 bg-accent-20 text-accent">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="font-serif text-[1.25rem] text-bone">
                  {successCount} file{successCount === 1 ? "" : "s"} uploaded.
                </div>
                <div className="mt-1 font-mono text-[0.85rem] text-bone-70">
                  We'll email the cleaned version back in the same format —
                  usually within <span className="text-accent">a day or two</span>.
                </div>
              </div>
              <button
                onClick={() => setSuccessCount(null)}
                className="text-steel-70 hover:text-bone"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <UploadDropzone onUploaded={onUploaded} />
        </div>

        <div className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-[1.6rem] text-bone">
              Queue
            </h2>
            <Kicker>{files.length} file{files.length === 1 ? "" : "s"}</Kicker>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 border border-line bg-panel-30 py-16 font-mono text-[0.85rem] text-steel-70">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <FileList files={files} />
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <div className="bg-canvas p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          {label}
        </div>
        <div
          className={`flex h-7 w-7 items-center justify-center border border-line ${
            tone === "accent" ? "text-accent" : "text-bone-80"
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="font-serif text-[2rem] leading-tight text-bone">
        {value}
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
function Tick({ classes }: { classes: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 border-current ${classes}`}
      style={{ width: 8, height: 8 }}
    />
  );
}