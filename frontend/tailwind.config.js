module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: "#7C9A82",
        beige: "#FAF7F2",
        sand: "#B8A99A",
        ink: "#2B2B2B",
        muted: "#6B6B6B",
        border: "#E8E2DA",
        success: "#6FA37A",
        warn: "#D9A441",
        danger: "#C96B5C"
      },
      borderRadius: { card: "12px", btn: "8px" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] }
    }
  },
  plugins: []
};