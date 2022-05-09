import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { rollup, InputOptions, OutputOptions } from 'rollup'
import rollupPluginTypescript from 'rollup-plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve'

const CompileTsServiceWorker = () => ({
  name: 'compile-typescript-service-worker',
  async writeBundle(_options, _outputBundle) {
    const inputOptions = {
      input: 'src/service-worker.ts',
      plugins: [rollupPluginTypescript(), nodeResolve()],
    }
    const outputOptions: OutputOptions = {
      file: 'dist/service-worker.js',
      format: 'es',
    }
    const bundle = await rollup(inputOptions)
    await bundle.write(outputOptions)
    await bundle.close()
  }
})


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        short_name: "Trees Creator App",
        name: "Create Your Trees",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "logo192.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "512x512",
          },
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
      },
    }),
    CompileTsServiceWorker()
  ],
});
