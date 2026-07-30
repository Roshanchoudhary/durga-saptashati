import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://durga-saptashati.pages.dev',
  integrations: [mdx()],
  output: 'static',
  build: {
    assets: '_astro'
  }
});
