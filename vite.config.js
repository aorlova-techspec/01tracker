import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — относительные пути, чтобы сборка работала
// и на GitHub Pages (/01tracker/), и на любом другом хостинге.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
