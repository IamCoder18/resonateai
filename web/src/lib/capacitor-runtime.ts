"use client";

import { Capacitor } from "@capacitor/core";

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getCapacitorServerUrl(): string | null {
  try {
    const cfg = (Capacitor as unknown as { config?: { server?: { url?: string } } })
      .config;
    return cfg?.server?.url ?? null;
  } catch {
    return null;
  }
}

export function getRuntimePlatform(): "ios" | "android" | "web" {
  try {
    return Capacitor.getPlatform() as "ios" | "android" | "web";
  } catch {
    return "web";
  }
}
