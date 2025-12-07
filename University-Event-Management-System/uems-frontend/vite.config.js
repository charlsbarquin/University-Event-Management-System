import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Remove proxy for production
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    } : undefined,
  },
  // ✅ ADDED FOR RENDER: Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', 'lucide-react'],
          utils: ['axios', 'date-fns', 'react-hook-form'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // ✅ ADDED FOR RENDER: Base path configuration
  base: '/',
  // ✅ ADDED: Preview server configuration
  preview: {
    port: 3000,
    host: true,
  },
  // ✅ ADDED: Environment variable replacement
  define: {
    'process.env': process.env,
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})