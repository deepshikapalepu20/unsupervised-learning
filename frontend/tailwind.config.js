/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      colors: {
        void:    "#080A0F",
        panel:   "#0D1117",
        surface: "#131921",
        border:  "#1E2733",
        muted:   "#2A3441",
        amber:   "#F59E0B",
        heat:    "#FF4500",
        cool:    "#00D4FF",
        safe:    "#22C55E",
        warn:    "#F59E0B",
        danger:  "#EF4444",
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan":         "scan 2s linear infinite",
        "fade-in":      "fadeIn 0.5s ease forwards",
        "slide-up":     "slideUp 0.4s ease forwards",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%":   { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
