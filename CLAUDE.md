{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica-Light;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\pard\tx560\tx1120\tx1680\tx2240\tx2800\tx3360\tx3920\tx4480\tx5040\tx5600\tx6160\tx6720\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # alexandreberger.com \'97 vitrine\
\
## Contexte\
Site vitrine d'Alexandre Berger, r\'e9alisateur freelance (\'cele-de-France), en Astro.\
Priorit\'e9 n\'b01 : le SEO / r\'e9f\'e9rencement organique. Astro a \'e9t\'e9 choisi pour son HTML\
rendu au build, meilleur pour Google qu'une SPA. Contenu g\'e9r\'e9 via Pages CMS\
(headless CMS bas\'e9 GitHub) qui commite directement dans ce d\'e9p\'f4t \'97 attendre des\
commits automatiques "(via Pages CMS)" tr\'e8s fr\'e9quents, y compris pendant une\
session de travail.\
\
## Stack technique\
- Astro 7, `output: 'server'` + adapter `@astrojs/vercel`, mais **toutes les\
  pages ont `export const prerender = true`** (site statique) \'97 seule\
  `/api/booking` est une vraie fonction serveur (formulaire de contact via Resend).\
- D\'e9ploy\'e9 sur Vercel. `astro.config.mjs` : `site` pointe encore vers\
  `alexandreberger.vercel.app` (domaine d\'e9finitif `alexandreberger.com` pas\
  encore branch\'e9 \'97 il r\'e9pond en 404 via un serveur Varnish tiers, sans rapport\
  avec ce projet). `build.inlineStylesheets: 'auto'` (d\'e9faut Astro, explicit\'e9).\
- Contenu : `astro:content` avec loader `glob`, 3 collections dans\
  `src/content.config.ts` : `projets` (Commandes + Cr\'e9ations, cat\'e9gorie via\
  `categorie: "commandes" | "creations"`), `carnet`, `projetsSatellites`.\
  `generateId` personnalis\'e9 sur `projets` pour ignorer le sous-dossier\
  Commandes/Cr\'e9ations et ne garder que le nom de fichier (slug stable).\
- **Pas de helper `image()` d'Astro** dans les sch\'e9mas : Pages CMS \'e9crit des\
  chemins publics (`/uploads/...`) en frontmatter, et le pipeline d'assets\
  d'Astro casse dessus (bug ImageNotFound d\'e9j\'e0 rencontr\'e9). Tous les champs\
  image sont de simples `z.string()`.\
- CMS : `.pages.yml` \'e0 la racine, d\'e9finit les collections `projets-commandes`,\
  `projets-creations`, `carnet`, `projets-satellites` (labels/champs visibles\
  dans Pages CMS).\
\
## Pipeline d'images (WebP/AVIF)\
- `scripts/optimize-images.mjs` (via `sharp`) g\'e9n\'e8re, pour chaque image de\
  `public/uploads/`, des variantes 480/640/960px en WebP + AVIF dans\
  `public/uploads/_optimise/`, consomm\'e9es par `src/components/OptimizedImage.astro`\
  (remplace `<img>` partout, sert un `<picture>` avec repli sur l'original si\
  rien n'a \'e9t\'e9 g\'e9n\'e9r\'e9).\
- Lanc\'e9 via `predev`/`prebuild` (voir `package.json`) \'97 donc automatique \'e0\
  chaque `npm run dev` / `npm run build`.\
- **Le cache est bas\'e9 sur un hash du contenu source (pas la date de\
  modification)**, et les d\'e9riv\'e9es sont **commit\'e9es dans le d\'e9p\'f4t**\
  (`public/uploads/_optimise/` n'est plus dans `.gitignore`). Raison : Vercel\
  repart d'un clone Git neuf \'e0 chaque d\'e9ploiement (mtime inutilisable), et\
  Pages CMS d\'e9clenche un d\'e9ploiement \'e0 quasi chaque modification \'97 sans cache\
  persistant, chaque d\'e9ploiement retraitait toutes les images (~7 min). Avec\
  le hash + commit, un d\'e9ploiement sans nouvelle image ne retraite rien.\
- Sources calibr\'e9es par l'utilisateur en 960\'d71280px (portrait) \'97 pas de palier\
  au-del\'e0 de 960 volontairement.\
- **Apr\'e8s chaque `npm run build` qui g\'e9n\'e8re de nouvelles d\'e9riv\'e9es, les\
  committer** (`git add public/uploads/_optimise` + commit) sinon le prochain\
  d\'e9ploiement Vercel les reg\'e9n\'e8re \'e0 vide.\
- `src/lib/image-config.mjs` : config partag\'e9e script \uc0\u8596  composant (largeurs,\
  dossier, helpers de chemin) \'97 ne jamais d\'e9synchroniser les deux.\
- Un `manifest.json` dans `_optimise/` stocke aussi les dimensions r\'e9elles de\
  chaque source, pour poser `width`/`height` HTML sur chaque `<img>` (CLS).\
\
## Carrousel (home + Cr\'e9ations)\
- `src/components/CarrouselHome.astro`, aliment\'e9 par les projets avec\
  `carrousel: true` (champ CMS), tri\'e9s par `ordreCarrousel`.\
- Champs CMS d\'e9di\'e9s (optionnels) : `carrouselImage`/`carrouselImageAlt`\
  (visuel sp\'e9cifique, sinon repli sur `couverture`), `carrouselTitre` (titre\
  court affich\'e9 sur la carte, sinon repli sur `titre`).\
- **Identique sur `/` et `/creations`** (m\'eame s\'e9lection/ordre) : effet\
  "one page" volontaire au switch Films de commande / Cr\'e9ations.\
- **D\'e9filement infini** dans les deux sens (clic fl\'e8ches + glissement\
  tactile/trackpad) : le script clone les visuels avant/apr\'e8s le segment r\'e9el\
  et repositionne le scroll sans transition en zone clon\'e9e. Attention :\
  `scroll-behavior:smooth` (CSS) s'applique \'e0 toute \'e9criture de `scrollLeft`,\
  pas seulement aux scrolls volontaires \'97 le repositionnement doit forcer\
  `scroll-behavior:auto` le temps du saut, sinon \'e7a s'anime visiblement.\
- Cartes en portrait 3:4, `fetchpriority="high"` sur les 2 premi\'e8res images\
  (LCP variable selon les runs Lighthouse entre la 1\'e8re et la 2\'e8me carte,\
  toutes deux de m\'eame taille).\
- **Pi\'e8ge r\'e9current** : `carrouselImage` est prioritaire sur `couverture`. Si\
  l'utilisateur remplace une image dans le CMS mais laisse l'ancien nom dans\
  `carrouselImage`, le fichier n'existe plus \uc0\u8594  le carrousel semble "ne pas se\
  mettre \'e0 jour". V\'e9rifier syst\'e9matiquement que chaque `couverture`/\
  `carrouselImage` r\'e9f\'e9renc\'e9 existe bien sur disque en cas de bug d'affichage\
  (voir commande de v\'e9rification dans les notes de session, pas de script\
  d\'e9di\'e9 pour l'instant).\
\
## Autres composants/pages notables\
- `src/components/OptimizedImage.astro` : voir pipeline d'images ci-dessus.\
  **Pi\'e8ge Astro** : les styles CSS scop\'e9s d'un parent (ex. `.couverture img`)\
  ne s'appliquent PAS aux \'e9l\'e9ments rendus par un composant enfant \'97 il faut\
  `:global()` sur la partie du s\'e9lecteur qui vise l'int\'e9rieur du composant\
  (d\'e9j\'e0 fait partout o\'f9 `OptimizedImage` est utilis\'e9 ; y penser pour toute\
  nouvelle utilisation).\
- `src/components/TitreSwitch.astro` : bascule de titre (fa\'e7on onglet) entre\
  Films de commande / Cr\'e9ations, desktop uniquement.\
- `src/components/Signature.astro` : phrases d'accroche qui alternent en fondu,\
  timing al\'e9atoire (3.5\'966.5s), jamais deux fois la m\'eame \'e0 la suite.\
- `src/pages/api/booking.ts` : formulaire de contact, envoie 2 emails via\
  Resend (`RESEND_API_KEY`, `RESEND_FROM`, `BOOKING_NOTIFY_EMAIL` en env vars,\
  voir `.env.example`). Honeypot anti-spam (`site`). Guard explicite si la cl\'e9\
  API est absente (sinon crash au chargement du module).\
- Police **Inter auto-h\'e9berg\'e9e** (`public/fonts/`, 2 fichiers de police\
  variable : normal 300-800 + italique 300) \'97 plus de d\'e9pendance Google Fonts.\
- Correctif Safari (`-webkit-text-size-adjust`) inlin\'e9 en `<style>` brut dans\
  le `<head>` de `Layout.astro` (le minifieur Vite supprime ce pr\'e9fixe s'il\
  passe par le pipeline CSS normal d'Astro).\
- Donn\'e9es structur\'e9es JSON-LD (schema.org) : `Person` sur toutes les pages\
  (dans `Layout.astro`), `VideoObject`/`CreativeWork` sur les fiches projet,\
  `BlogPosting` sur le Carnet, `CreativeWork` sur les Projets Satellites.\
- Liste des clients (footer) : disposition flexbox qui retourne \'e0 la ligne\
  selon la largeur r\'e9elle du texte (pas de d\'e9coupage manuel par nombre fixe).\
- Picto YouTube dans le header (`https://www.youtube.com/@alexandreberger`).\
\
## R\'e8gles \'e0 respecter\
- **NE PAS toucher aux slugs d'URL des projets** : ils portent des mots-cl\'e9s\
  SEO (mosaert-stromae, paludiers-sel...). Le texte affich\'e9 peut diff\'e9rer du\
  slug.\
- Garder les m\'e9tas SEO (title, description, og:) riches en mots-cl\'e9s :\
  "r\'e9alisateur", "documentaire, fiction, film de marque", "\'cele-de-France",\
  "r\'e9alisateur freelance".\
- **Modifications de style/mise en page : desktop uniquement par d\'e9faut**,\
  sauf mention explicite de "mobile" par l'utilisateur (r\'e8gle m\'e9moris\'e9e,\
  redemand\'e9e plusieurs fois).\
- Toujours tester avant de livrer : `npm run build` + v\'e9rification visuelle\
  (Browser pane), jamais juste "\'e7a devrait marcher".\
\
## Workflow git (important, \'e0 cause de Pages CMS)\
Pages CMS commite en continu, souvent plusieurs fois par session. Avant de\
pousser un changement :\
1. `git add` + `git commit` en local d'abord (jamais de push direct sans\
   commit local propre).\
2. `git pull --rebase origin main` (quasi toujours des commits distants en\
   attente).\
3. `npm run build` pour v\'e9rifier que tout compile apr\'e8s le rebase (et\
   reg\'e9n\'e9rer le manifest d'images si de nouveaux visuels sont arriv\'e9s).\
4. Si le build a g\'e9n\'e9r\'e9 de nouvelles d\'e9riv\'e9es d'images\
   (`public/uploads/_optimise/`), les commiter aussi avant de pousser.\
5. `git push origin main`.\
En cas de conflit sur un fichier de contenu, toujours pr\'e9server le contenu\
r\'e9el ajout\'e9 par Pages CMS plut\'f4t que d'anciennes donn\'e9es de test.\
\
## \'c0 faire\
- Page de vente s\'e9par\'e9e (non commenc\'e9e).\
- Brancher le domaine d\'e9finitif `alexandreberger.com` sur Vercel, puis mettre\
  \'e0 jour `site` dans `astro.config.mjs`.\
}