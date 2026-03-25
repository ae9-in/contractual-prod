import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    strictPort: true,
    hmr: {
      host: '127.0.0.1',
    },
  },
  plugins: [react(), tailwindcss()],
  build: {
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'vendor-react';
          }
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('axios')) return 'vendor-network';
          if (id.includes('socket.io-client')) return 'vendor-realtime';
          return 'vendor';
        },
      },
    },
  },
});
