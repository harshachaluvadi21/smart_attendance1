import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/smartattend-ai/", // GitHub Pages base path
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('face-api')) {
              return 'faceapi';
            }
            if (id.includes('opencv')) {
              return 'opencv';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('framer-motion')) {
              return 'animations';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
