import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { RevealClient } from "@/components/reveal-client";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resonate AI — Audio cleaning, delivered",
  description:
    "Send raw recordings with hiss, hum, or room tone. Get them back cleaned up — usually within a day or two.",
  keywords: [
    "audio cleaning",
    "podcast editing",
    "noise removal",
    "audio post-production",
    "resonate",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js-ready');`,
          }}
        />
      </head>
      <body
        className={`${serif.variable} ${mono.variable} font-mono antialiased bg-canvas text-bone`}
      >
        {children}
        <RevealClient />
      </body>
    </html>
  );
}
