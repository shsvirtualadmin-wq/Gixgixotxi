import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import firebaseAppletConfig from './firebase-applet-config.json';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY?.trim() || process.env.VITE_FIREBASE_API_KEY?.trim() || (!isProd ? firebaseAppletConfig?.apiKey : '')),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || (!isProd ? firebaseAppletConfig?.authDomain : '') || 'gen-lang-client-0365509316.firebaseapp.com'),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID?.trim() || process.env.VITE_FIREBASE_PROJECT_ID?.trim() || (!isProd ? firebaseAppletConfig?.projectId : '')),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || (!isProd ? firebaseAppletConfig?.storageBucket : '')),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || (!isProd ? firebaseAppletConfig?.messagingSenderId : '')),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID?.trim() || process.env.VITE_FIREBASE_APP_ID?.trim() || (!isProd ? firebaseAppletConfig?.appId : '')),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.trim() || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID?.trim() || (!isProd ? firebaseAppletConfig?.firestoreDatabaseId : '')),
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf-export';
              if (id.includes('katex') || id.includes('rehype-katex') || id.includes('remark-math')) return 'vendor-math';
              if (id.includes('canvas-confetti')) return 'vendor-confetti';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR === 'true' ? false : { port: 24678 },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
