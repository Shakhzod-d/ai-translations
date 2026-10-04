/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { geminiDevProxy } from './server/vite-dev-proxy';

export default defineConfig(({ mode }) => ({
  // '' prefix loads non-VITE_ vars too; GEMINI_API_KEY is used only by the dev server, never bundled.
  plugins: [
    react(),
    tailwindcss(),
    geminiDevProxy(loadEnv(mode, process.cwd(), '').GEMINI_API_KEY),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/shared/config/test/setup.ts'],
    css: false,
    // Tests must not depend on the developer's .env; built-in AI is opted into per test.
    env: { VITE_BUILTIN_AI: 'false', VITE_API_URL: '' },
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
}));
