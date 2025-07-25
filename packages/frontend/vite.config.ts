import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable React 19 features
      jsxImportSource: 'react',
      babel: {
        plugins: [
          // Enable React Compiler when available
          // ['babel-plugin-react-compiler']
        ]
      }
    }),
    tailwindcss()
  ],
  
  // Development server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // Preview server configuration
  preview: {
    port: 3000,
    host: true,
    cors: true
  },

  // Build configuration
  build: {
    target: 'baseline-widely-available', // Vite 7 default
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
          maps: ['leaflet', 'react-leaflet'],
          utils: ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // Optimization configuration
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'lucide-react',
      'recharts',
      'leaflet',
      'react-leaflet',
      'date-fns',
      'clsx',
      'tailwind-merge'
    ]
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // Enable modern features
  esbuild: {
    target: 'es2022',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
