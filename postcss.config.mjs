// Tailwind v4 con PostCSS: lo usan tanto Turbopack (npm run dev) como Webpack
// (npm run build, que en el servidor de Hostinger no puede lanzar los procesos aparte
// que necesita Turbopack para el CSS).
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
