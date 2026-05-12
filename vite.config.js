import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Proxies /api/football/* to API-Football (RapidAPI or api-sports.io).
// The API key stays in Node (dev server) only — never use VITE_* for secrets.
// Production static hosts do not run this proxy; use a serverless route or backend.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiKey =
    env.API_FOOTBALL_KEY ||
    env["api-football-v1-pkey"] ||
    ""
  // Default apisports: keys from dashboard.api-football.com / api-sports.io (like Live Demo).
  // Use API_FOOTBALL_MODE=rapidapi only if you subscribed on RapidAPI.com.
  const provider = (env.API_FOOTBALL_MODE || "apisports").toLowerCase()

  const target =
    provider === "apisports"
      ? "https://v3.football.api-sports.io"
      : "https://api-football-v1.p.rapidapi.com"

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api/football": {
          target,
          changeOrigin: true,
          rewrite: (path) => {
            let p = path.replace(/^\/api\/football/, "")
            if (provider === "rapidapi") {
              if (p.startsWith("/fixtures")) {
                p = "/v3" + p
              }
              return p
            }
            // api-sports.io: correct URL is https://v3.football.api-sports.io/fixtures?...
            if (p.startsWith("/v3")) {
              p = p.replace(/^\/v3/, "") || "/"
            }
            return p
          },
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (!apiKey) return
              if (provider === "apisports") {
                proxyReq.setHeader("x-apisports-key", apiKey)
              } else {
                proxyReq.setHeader("X-RapidAPI-Key", apiKey)
                proxyReq.setHeader(
                  "X-RapidAPI-Host",
                  "api-football-v1.p.rapidapi.com",
                )
              }
            })
          },
        },
      },
    },
  }
})
