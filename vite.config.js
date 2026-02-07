import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: '/gardenatlas/',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
