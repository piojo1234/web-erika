import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        proyectate: resolve(__dirname, 'proyectate.html'),
        testVocacional: resolve(__dirname, 'test-vocacional.html'),
        testAutoestima: resolve(__dirname, 'test-autoestima.html'),
        testLenguajeAmor: resolve(__dirname, 'test-lenguaje-amor.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
