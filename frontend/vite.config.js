import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Thêm dòng này để cho phép các domain từ localtunnel và ngrok truy cập vào
    allowedHosts: [".loca.lt", ".ngrok-free.app"],
  },
});
