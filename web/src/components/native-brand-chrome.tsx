"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const BRAND_ACCENT = "#7a3818";

export function NativeBrandChrome() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    void (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        if (cancelled) return;
        await StatusBar.setBackgroundColor({ color: BRAND_ACCENT });
        if (cancelled) return;
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        /* status-bar plugin not available — fall back to capacitor.config defaults */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
