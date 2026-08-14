import {
  getCapacitorServerUrl,
  isNativePlatform,
} from "@/lib/capacitor-runtime";

export const DEPLOYED_BASE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_BASE_URL ||
  process.env.BETTER_AUTH_URL ||
  "https://resonate.aaravlabs.com";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return DEPLOYED_BASE_URL;
  if (isNativePlatform()) {
    const cap = getCapacitorServerUrl();
    if (cap) return cap.replace(/\/$/, "");
    return DEPLOYED_BASE_URL.replace(/\/$/, "");
  }
  return window.location.origin;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!path.startsWith("/")) path = `/${path}`;
  return `${base}${path}`;
}
