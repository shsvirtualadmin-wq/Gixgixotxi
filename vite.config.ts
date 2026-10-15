import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify('AIzaSyDNnUtJ0s0ZlNUvs-SVC0i5MaQLV8F3Uqs'),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify('auth.boardly.cfd'),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('boardly-8c0cd'),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify('boardly-8c0cd.firebasestorage.app'),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify('423201171551'),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify('1:423201171551:web:219bb34b-b7b4-4c85-bd1f-8efd086df9c2'),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify('(default)'),
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
