import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        panel: {
          DEFAULT: "var(--panel)",
          30: "var(--panel-30)",
          40: "var(--panel-40)",
          50: "var(--panel-50)",
          60: "var(--panel-60)",
          70: "var(--panel-70)",
          90: "var(--panel-90)",
        },
        bone: {
          DEFAULT: "var(--bone)",
          70: "var(--bone-70)",
          80: "var(--bone-80)",
        },
        steel: {
          DEFAULT: "var(--steel)",
          40: "var(--steel-40)",
          55: "var(--steel-55)",
          70: "var(--steel-70)",
        },
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
          10: "var(--accent-10)",
          20: "var(--accent-20)",
          40: "var(--accent-40)",
          60: "var(--accent-60)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
        sans: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.02em",
        ultrasnap: "0.28em",
      },
      maxWidth: {
        shell: "1440px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
