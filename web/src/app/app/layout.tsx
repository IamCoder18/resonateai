import type { Metadata } from "next";
import { MobileScaffold } from "@/components/mobile-scaffold";

export const metadata: Metadata = {
  title: "Resonate AI",
  description: "Upload audio or video, get a polished MP3 back.",
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileScaffold>{children}</MobileScaffold>;
}
