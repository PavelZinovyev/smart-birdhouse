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
});
