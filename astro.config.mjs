// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Domaine actuellement en ligne (Vercel). À remplacer par le domaine définitif
  // (ex. https://alexandreberger.com) dès qu'il est branché — sinon les URLs
  // canoniques et le sitemap pointeront vers la mauvaise adresse.
  site: 'https://alexandreberger.vercel.app',
  integrations: [sitemap()],
});
