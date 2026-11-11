module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#101113",
        surface: "#191B1E",
        "surface-2": "#22252A",
        text: "#F4F3F1",
        muted: "#A5A7AA",
        accent: "#19B6A3",
        berry: "#C34B83",
        blue: "#397BE5",
        terra: "#C85A3E",
        sage: "#19B6A3",
        beige: "#191B1E",
        sand: "#A5A7AA",
        ink: "#F4F3F1",
        border: "#2A2D33",
        success: "#19B6A3",
        warn: "#E8A838",
        danger: "#E24B4A"
      },
      borderRadius: { card: "20px", btn: "12px" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] }
    }
  },
  plugins: []
};
