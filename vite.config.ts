import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '.', '.'),
    },
  },
  server: {
    allowedHosts: true as const,
    hmr: false,
    watch: {
      ignored: ['**/.env*', '**/.api-key.json', '**/.alignment-logs.json', '**/.voice-logs.json'],
    },
  },
});
