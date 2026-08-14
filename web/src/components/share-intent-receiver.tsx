"use client";

import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { MobileUploadCard } from "@/components/mobile-upload-card";
import type { MobileUploadedFile } from "@/components/mobile-upload-card";
import { Music } from "lucide-react";

interface SharedFile {
  name: string;
  type: string;
  uri: string;
  size?: number;
}

export function ShareIntentReceiver() {
  const [file, setFile] = useState<SharedFile | null>(null);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    void (async () => {
      try {
        if (!Capacitor.isNativePlatform()) return;
        const handler = await CapacitorApp.addListener(
          "appUrlOpen",
          (event) => {
            const url = new URL(event.url);
            const name = url.searchParams.get("name") ?? "shared";
            const type = url.searchParams.get("type") ?? "audio/*";
            const uri = url.searchParams.get("uri") ?? "";
            if (uri) setFile({ name, type, uri });
          },
        );
        sub = handler;
      } catch {
        /* no share intent available */
      }
    })();
    return () => {
      if (sub) sub.remove();
    };
  }, []);

  function onUploaded(uploaded: MobileUploadedFile[]) {
    if (uploaded.length > 0) setFile(null);
  }

  if (!file) {
    return (
      <div className="border border-line bg-panel-30 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border border-line bg-panel-40 text-accent">
          <Music className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div className="font-serif text-[1.2rem] leading-tight text-bone">
          Nothing shared yet.
        </div>
        <div className="mt-1 font-mono text-[0.78rem] text-steel-70">
          Open this app from the share menu of another app to send a file
          here.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 border border-accent-40 bg-accent-10 p-4">
        <div className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">
          Shared
        </div>
        <div className="mt-1 truncate font-serif text-[1.1rem] text-bone">
          {file.name}
        </div>
        <div className="mt-1 font-mono text-[0.72rem] text-steel-70">
          {file.type}
        </div>
      </div>
      <MobileUploadCard onUploaded={onUploaded} />
    </div>
  );
}
