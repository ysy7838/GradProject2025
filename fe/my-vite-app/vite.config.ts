import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {VitePWA} from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => {
  const plugins = [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["images/icon.svg"],
      manifest: {
        short_name: "SmartMemo",
        name: "SmartMemo - 똑똑한 메모",
        description: "메모를 편리하고 간편하게",
        icons: [
          {
            src: "/images/icon.svg",
            type: "image/svg+xml",
            sizes: "any",
            purpose: "any maskable",
          },
        ],
        id: "/",
        start_url: "/",
        display: "standalone",
        theme_color: "#3EA99F",
        background_color: "#ffffff",
        orientation: "any",
        categories: ["productivity", "utilities"],
        lang: "ko-KR",
        dir: "ltr",
        prefer_related_applications: false,
        scope: "/",
        display_override: ["window-controls-overlay"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 3000000,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ];

  return {
    publicDir: "public",
    plugins,
    resolve: {
      alias: [{find: "@", replacement: path.resolve(__dirname, "src")}],
    },
    build: {
      assetsDir: "assets",
      outDir: "dist",
      rollupOptions: {
        input: {app: path.resolve(__dirname, "index.html")},
        output: {
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log("Sending Request to the Target:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log("Received Response from the Target:", proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  };
});
