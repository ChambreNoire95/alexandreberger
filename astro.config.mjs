// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Domaine actuellement en ligne (Vercel). À remplacer par le domaine définitif
  // (ex. https://alexandreberger.com) dès qu'il est branché — sinon les URLs
  // canoniques et le sitemap pointeront vers la mauvaise adresse.
  site: 'https://alexandreberger.vercel.app',
  integrations: [sitemap()],
  // "server" + prerender:true par page (voir chaque .astro) : tout le site
  // reste généré statiquement au build (SEO, cf. CLAUDE.md), à l'exception
  // de la route /api/booking qui doit tourner en fonction serveur pour
  // traiter le formulaire de contact.
  output: 'server',
  adapter: vercel(),
  // Inline les petites feuilles de style (< 4 Ko) directement dans le HTML
  // au lieu d'un <link> séparé : une requête bloquante de moins dans la
  // chaîne critique (signalé par Lighthouse).
  build: { inlineStylesheets: 'auto' },
});
