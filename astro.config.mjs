import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://www.dalelismechanicalco.com',
  // Hybrid mode: pages are static by default, but routes can opt into SSR
  // by exporting `export const prerender = false`. This lets the maintenance
  // plan signup endpoint run server-side while keeping the rest of the site
  // as fast static HTML.
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
