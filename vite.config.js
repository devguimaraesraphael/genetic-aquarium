import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    open: true, // abre o browser automaticamente
    hmr: true, // hot module replacement ativo
  },
});
