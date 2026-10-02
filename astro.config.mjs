// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Domaine définitif. Côté Vercel, c'est la version "www" qui est le domaine
  // principal (alexandreberger.com redirige vers elle) : les URLs canoniques et
  // le sitemap doivent pointer vers elle. Si le domaine principal change dans
  // Vercel, changer cette ligne et le Sitemap de public/robots.txt en même temps.
  site: 'https://www.alexandreberger.com',
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
