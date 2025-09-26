import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-info'
import { VitePWA } from 'vite-plugin-pwa'

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'WhiskyVerse - Viski Severler Topluluğu',
        short_name: 'WhiskyVerse',
        description: 'Viski severler için nihai topluluk platformu. Viskiler keşfedin, koleksiyonunuzu oluşturun, toplulukla bağlantı kurun.',
        theme_color: '#f58a3a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Koleksiyonum',
            short_name: 'Koleksiyon',
            description: 'Kişisel viski koleksiyonunu görüntüle',
            url: '/collection',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Viski Keşfet',
            short_name: 'Keşfet',
            description: 'Yeni viskiler keşfet',
            url: '/whiskies',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit instead of default 2MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/pznuleevpgklxuuojcpy\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
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

