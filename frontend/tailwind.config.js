/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html,css}"], // scan your components
  darkMode: "class", // enables `dark:` variants via <body class="dark">
  theme: {
    extend: {
      colors: {
        // optional: add custom tag colors later like "bug": "#F87171"
      },
    },
  },
  plugins: [],
};
