import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Frontend runs on http://localhost:5173
// It does NOT need the backend (Sprint 2 rule): all data comes from src/services/mockApi.js
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
