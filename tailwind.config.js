/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"JetBrains Mono"', '"SFMono-Regular"', "Menlo", "monospace"],
        display: ["Sora", "Inter", '"Segoe UI"', "system-ui", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        brand: ['"JetBrains Mono"', "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Light default. 60-30-10: off-white green page (60),
        // white card surfaces (30), single green accent (10).
        background: "#F8FAF8",
        foreground: "#172B24",
        "muted-foreground": "#5C6F66",
        muted: "#EEF2EF",
        primary: {
          DEFAULT: "#247D59",
          hover: "#1D6B4C",
          foreground: "#FFFFFF",
          light: "#E2F0E9",
        },
        accent: {
          light: "#E2F0E9",
          teal: "#2F8F8B",
          "teal-hover": "#267A76",
          "teal-light": "#DCF0EE",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#172B24",
        },
        border: "#E1E7E3",
        warning: {
          DEFAULT: "#B7791F",
          light: "#FAF3E3",
        },
        danger: {
          DEFAULT: "#B43A30",
          foreground: "#FFFFFF",
          light: "#FAECEB",
        },
      },
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },
    },
  },
  plugins: [],
};
