/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        bg: "#000",
        surface: "#111",
        border: "rgba(255,255,255,0.1)",
        accent: "#d4a030",
        muted: "#555",
        text: "#fff",
        sub: "rgba(255,255,255,0.45)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(200%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse2: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        scan: "scan 2.5s linear infinite",
        fadeUp: "fadeUp 0.5s ease forwards",
        pulse2: "pulse2 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
