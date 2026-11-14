module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        berry: "var(--berry)",
        blue: "var(--blue)",
        terra: "var(--terra)",
        sage: "var(--accent)",
        beige: "var(--surface)",
        sand: "var(--muted)",
        ink: "var(--text)",
        border: "var(--border)",
        success: "var(--success)",
        warn: "var(--warn)",
        danger: "var(--danger)"
      },
      borderRadius: { card: "20px", btn: "12px" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] }
    }
  },
  plugins: []
};