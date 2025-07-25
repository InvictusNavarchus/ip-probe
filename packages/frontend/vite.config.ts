import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
      port: parseInt(env.VITE_DEV_PORT) || 3000,
      host: env.VITE_DEV_HOST || 'localhost',
      open: env.VITE_DEV_OPEN === 'true',
      cors: true,
      https: env.VITE_HTTPS === 'true',
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },

    // Preview server configuration
    preview: {
      port: parseInt(env.VITE_DEV_PORT) || 3000,
      host: env.VITE_DEV_HOST || 'localhost',
      cors: true
    },

    // Build configuration
    build: {
      target: env.VITE_BUILD_TARGET || 'baseline-widely-available', // Vite 7 default
      outDir: 'dist',
      sourcemap: env.VITE_ENABLE_SOURCEMAPS === 'true',
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
      chunkSizeWarningLimit: parseInt(env.VITE_CHUNK_SIZE_LIMIT) || 1000
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
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'IP Probe'),
      __APP_DESCRIPTION__: JSON.stringify(env.VITE_APP_DESCRIPTION || 'Network Analysis Dashboard')
    },

    // Enable modern features
    esbuild: {
      target: env.VITE_BUILD_TARGET || 'es2022',
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
  };
});
