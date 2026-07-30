import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://durgasaptashati.com',
  integrations: [sitemap(), mdx()],
  output: 'static',
  build: {
    assets: '_astro'
  },
  markdown: {
    shikiConfig: {
      theme: 'nord'
    }
  }
});
