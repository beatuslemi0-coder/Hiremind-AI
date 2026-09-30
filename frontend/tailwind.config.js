/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1d4ed8",
          orange: "#f48936",
          pink: "#e3297c",
          gold: "#fbbf24",
          sky: "#3b82f6",
        },
        // Landing-page design tokens — total-black theme by default
        primary: "#ffffff",
        // Client palette (colors.png) — the "night" identity for the landing
        // + auth surfaces: deep indigo canvas, purple glass tiers, crimson accent.
        night: {
          canvas: "#02021B", // deepest base — page backdrop beneath the splash image
          indigo: "#0B0443", // primary glass tint (nav, cards)
          plum: "#250636", // secondary glass tier (stats, FAQ rows)
          mauve: "#311A46", // borders, chips, quiet surfaces
          crimson: "#B11345", // THE accent: CTAs, hover glow, focus
          cyan: "#22D3EE", // pulled from the splash-image wave — focus rings, waveform, links
        },
        secondary: "#f48936",
        accent: "#e3297c",
        "on-surface": "#f2f2f2",
        "on-surface-variant": "#a3a3a3",
        error: "#EF4444",
        success: "#22C55E",
      },
      boxShadow: {
        soft: "0px 4px 20px rgba(0,0,0,0.08)",
        "glow-gold": "0 0 24px rgba(251,191,36,0.28)",
        "glow-gold-lg": "0 0 40px rgba(251,191,36,0.22), 0 8px 32px rgba(19,90,173,0.18)",
        "elev-1": "0 1px 2px rgba(15,40,90,0.06), 0 1px 3px rgba(15,40,90,0.10)",
        "elev-2": "0 4px 6px -1px rgba(15,40,90,0.08), 0 12px 28px -8px rgba(15,40,90,0.16)",
        "elev-3": "0 12px 24px -8px rgba(15,40,90,0.16), 0 36px 64px -20px rgba(15,40,90,0.24)",
        "elev-4": "0 24px 48px -12px rgba(15,40,90,0.22), 0 56px 96px -28px rgba(15,40,90,0.28)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #fbbf24 0%, #f48936 35%, #3b82f6 75%, #1d4ed8 100%)",
        "brand-soft": "linear-gradient(140deg, rgba(251,191,36,0.16) 0%, rgba(59,130,246,0.14) 100%)",
        "brand-veil": "linear-gradient(120deg, rgba(251,191,36,0.10) 0%, rgba(59,130,246,0.10) 100%)",
      },
    },
  },
  plugins: [],
};
