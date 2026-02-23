import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import type { PluginOption } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: './', // относительные пути для раздачи статики с ESP32 (LittleFS)
  plugins: [react(), svgr() as PluginOption],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // В режиме dev запросы /api/* проксируем на ESP32 (подключитесь к Wi‑Fi SmartBirdhouse)
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.4.1',
        changeOrigin: true,
      },
    },
  },
});
