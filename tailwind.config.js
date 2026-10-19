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
      colors: {
        background: "#F8FAF8",
        foreground: "#172B24",
        "muted-foreground": "#52665B",
        primary: {
          DEFAULT: "#247D59",
          hover: "#1D6648",
          foreground: "#FFFFFF",
          light: "#EAF5ED",
        },
        accent: {
          light: "#EAF5ED",
          teal: "#2C8C89",
          "teal-hover": "#23726F",
          "teal-light": "#E8F4F4",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#172B24",
        },
        border: "#DEE8E1",
        warning: {
          DEFAULT: "#A86E19",
          light: "#FEF7E8",
        },
        danger: {
          DEFAULT: "#B42318",
          light: "#FEF3F2",
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
