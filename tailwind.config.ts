import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Executive Slate - Primary Dark Backgrounds
        "slate-950": "#090a0f",
        "slate-900": "#0d0e15",
        "slate-850": "#11121d",
        
        // Glass Card Surface
        "slate-glass": "#161726",
        "slate-glass-border": "#24263b",
        
        // Custom Accent Colors - rgb(20 60 144) (Royal Blue)
        primary: {
          DEFAULT: "#143c90",
          hover: "#1e4fb8",
          dark: "#0d2861"
        },
        accent: {
          DEFAULT: "#143c90",
          hover: "#1e4fb8"
        },
        
        // Functional Status Colors
        status: {
          to_check: "#f59e0b",      // Amber/Gold
          done: "#10b981",          // Emerald
          expired: "#ef4444",        // Crimson/Red
          not_actual: "#64748b",     // Slate
          ideas_backlog: "#6366f1"   // Indigo
        }
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;