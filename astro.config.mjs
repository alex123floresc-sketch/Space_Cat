// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Para GitHub Pages en el repo "Space_Cat":
//   https://alex123floresc-sketch.github.io/Space_Cat/
export default defineConfig({
  site: 'https://alex123floresc-sketch.github.io',
  base: '/Space_Cat',
  vite: {
    plugins: [tailwindcss()],
  },
});
