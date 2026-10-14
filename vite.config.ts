import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import federation from "@originjs/vite-plugin-federation";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
      "Access-Control-Allow-Headers":
        "Origin,Content-Type,Accept,Authorization,Cache-Control,X-COPA-TOKEN,X-COPA-WORKSPACE-ID,X-COMP-ID,x-bluecopa-solution-id,x-bluecopa-solution-branch,x-bluecopa-solution-branch-type,prefer",
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    federation({
      name: "__copa_ext_app__react_route",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./app/single-spa.tsx",
      },
      shared: ["react", "react-dom"],
    }),
  ],
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: false,
    ssr: false,
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        format: "system",
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || assetInfo.name;
          if (fileName && fileName.endsWith(".css")) {
            return "assets/remoteEntry.css";
          }
          return fileName || "assets/remoteEntry.css";
        },
      },
    },
  },
  base: "/",
});
