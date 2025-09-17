/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Include App Router paths
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tw-animate-css")
  ],
};

export default config;
