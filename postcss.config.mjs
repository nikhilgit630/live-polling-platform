/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Tailwind 4 plugin for Next.js 15
    autoprefixer: {},
  },
};

export default config;
