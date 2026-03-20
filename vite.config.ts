import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1", // Force IPv4
    port: 3000, // Use non-privileged port
    strictPort: true, // Don't auto-switch ports
    hmr: {
      host: "127.0.0.1",
      port: 3000,
      overlay: false,
    },
  },
  preview: {
    port: 3000,
    host: "127.0.0.1",
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));