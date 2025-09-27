import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-info'
// import { VitePWA } from 'vite-plugin-pwa' // Temporarily disabled

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
// PWA temporarily disabled for development
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: false
    //   }
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Enable host mode for network access
    port: 5173,
    open: false,
    https: process.env.HTTPS === 'true' ? {
      key: fs.existsSync('.ssl/key.pem') ? fs.readFileSync('.ssl/key.pem') : undefined,
      cert: fs.existsSync('.ssl/cert.pem') ? fs.readFileSync('.ssl/cert.pem') : undefined,
    } : false
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['framer-motion', 'lucide-react'],
          qr: ['qrcode', 'qr-scanner'],
        }
      }
    },
    target: 'es2018', // Better compatibility and smaller bundles
    minify: 'esbuild', // Faster and more efficient minification
    sourcemap: false // Disable sourcemaps in production for smaller build
  }
})

