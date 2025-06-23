import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    base: env.VITE_BASE_URL ?? "/",
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        manifest: {
          name: "Your App Name",
          short_name: "App",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#000000",
          icons: [
            {
              src: "/pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
