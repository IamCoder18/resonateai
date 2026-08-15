"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { MobileUploadCard } from "@/components/mobile-upload-card";
import type { MobileUploadedFile } from "@/components/mobile-upload-card";
import { apiUrl } from "@/lib/api-base";
import type { FileRecord } from "@/components/file-list";
import { FileList } from "@/components/file-list";
import { Loader2, ListMusic } from "lucide-react";

export default function AppConsolePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await authClient.getSession();
        if (cancelled) return;
        if (!session.data) {
          router.replace("/app/sign-in");
          return;
        }
        setUser({ name: session.data.user.name, email: session.data.user.email });
      } catch {
        if (!cancelled) router.replace("/app/sign-in");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl("/api/files"), {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { files?: FileRecord[] };
        if (!cancelled) setFiles(data.files ?? []);
      } finally {
        if (!cancelled) setLoadingFiles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function onUploaded(uploaded: MobileUploadedFile[]) {
    const records: FileRecord[] = uploaded.map((f) => ({
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
    setFiles((prev) => [...records, ...prev]);
  }

  const recentFiles = useMemo(() => {
    const sorted = [...files].sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
    const processing = sorted.filter((f) => f.status === "processing");
    const mostRecentReady = sorted.find((f) => f.status === "ready");
    const recent: FileRecord[] = [...processing];
    if (mostRecentReady) recent.push(mostRecentReady);
    return recent.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  }, [files]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-steel-70" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-steel-70">
          Console
        </div>
        <h1 className="mt-1 font-serif text-[1.8rem] leading-tight text-bone">
          Welcome back, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-1 font-mono text-[0.82rem] text-bone-70">
          Drop a file. We&apos;ll email the cleaned version back in the same format.
        </p>
      </div>

      <MobileUploadCard onUploaded={onUploaded} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[1.3rem] leading-none text-bone">
            Recent
          </h2>
          <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-steel-70">
            {recentFiles.length} file{recentFiles.length === 1 ? "" : "s"}
          </span>
        </div>
        {loadingFiles ? (
          <div className="flex items-center justify-center gap-2 border border-line bg-panel-30 py-12 font-mono text-[0.85rem] text-steel-70">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <FileList files={recentFiles} />
            <button
              type="button"
              onClick={() => router.push("/app/queue")}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 border border-white/15 bg-panel-30 font-mono text-[0.78rem] uppercase tracking-[0.16em] text-bone transition-colors hover:border-white/30 hover:bg-panel-40"
            >
              <ListMusic className="h-4 w-4" strokeWidth={1.5} />
              View queue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
