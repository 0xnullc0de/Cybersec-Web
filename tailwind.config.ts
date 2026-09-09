import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: "#050708",
          darker: "#090d10",
          dark: "#0e1317",
          card: "#12181d",
          cardHover: "#182128",
          border: "#1e2933",
          borderGlow: "#00ff66",
          green: "#00ff66",
          neon: "#00ff41",
          emerald: "#10b981",
          dimGreen: "#005522",
          muted: "#7d8b99",
          lightMuted: "#9aa7b5",
          text: "#e6edf3",
          htb: "#9fef00",
          thm: "#ff2d55",
          easy: "#22c55e",
          medium: "#f59e0b",
          hard: "#ef4444",
          insane: "#a855f7",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(0, 255, 102, 0.25)",
        "glow-lg": "0 0 40px -5px rgba(0, 255, 102, 0.4)",
        "glow-card": "0 0 20px -2px rgba(0, 255, 102, 0.12)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "blink 1.1s steps(2, start) infinite",
        "scan": "scan 8s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
