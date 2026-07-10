import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://39s3r2sh.ap-southeast.insforge.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
                return cookie
                  .replace(/;\s*Domain=[^;]+/gi, '')
                  .replace(/\bSecure\b;?\s*/gi, '')
                  .replace(/\bSameSite=None\b/gi, 'SameSite=Lax');
              });
            }
          });
        },
      },
      '/socket.io': {
        target: 'https://39s3r2sh.ap-southeast.insforge.app',
        changeOrigin: true,
        secure: true,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => {
                return cookie
                  .replace(/;\s*Domain=[^;]+/gi, '')
                  .replace(/\bSecure\b;?\s*/gi, '')
                  .replace(/\bSameSite=None\b/gi, 'SameSite=Lax');
              });
            }
          });
        },
      },
    },
  },
});
