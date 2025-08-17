import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // separate vendor chunks for better caching
          react: ["react", "react-dom"],
          mapbox: ["mapbox-gl"],
          turf: ["@turf/area"], // only what you use
        },
      },
    },
    chunkSizeWarningLimit: 2000, // raise the threshold to 2 MB
  },
});