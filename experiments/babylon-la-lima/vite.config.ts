import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: new URL('../../public', import.meta.url).pathname,
  server: { host: '127.0.0.1', port: 4174 },
  preview: { host: '127.0.0.1', port: 4174 },
  build: { outDir: 'dist', emptyOutDir: true },
});
