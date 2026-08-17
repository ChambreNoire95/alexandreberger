# Récap projet — alexandreberger.com

Document de reprise, généré le 2026-08-17. À coller en début d'une nouvelle conversation avec Claude pour continuer le travail avec tout le contexte nécessaire.

## En une phrase

Site vitrine d'Alexandre Berger, réalisateur freelance (Île-de-France), en Astro (site statique), avec Pages CMS comme back-office éditorial (GitHub-based, sans base de données), déployé sur Vercel depuis la branche `main`.

## Priorité du site

SEO / référencement organique. C'est la raison du choix d'Astro (HTML statique rendu au build, pas de SPA) et de la vigilance sur les métadonnées, les slugs d'URL, les balises `<head>`.

## Infrastructure

- **Dépôt GitHub** : `ChambreNoire95/alexandreberger` (public), branche unique `main` (pas de branches fantômes, aucune PR/issue ouverte).
- **Déploiement** : Vercel, auto-déployé à chaque push sur `main`. URL actuelle : **https://alexandreberger.vercel.app**
  - ⚠️ Le domaine définitif (`alexandreberger.com` selon le nom du projet) n'est *pas encore branché*. Quand il le sera, il faut mettre à jour `site:` dans `astro.config.mjs` (sinon les URLs canoniques et le sitemap continueront de pointer vers le domaine `.vercel.app`).
- **CMS** : [Pages CMS](https://pagescms.org), connecté au même repo GitHub, piloté par `.pages.yml` à la racine. Alexandre y édite le contenu directement ; chaque sauvegarde crée un commit "via Pages CMS" et redéploie automatiquement sur Vercel.
- **Stack** : Astro 7 (sortie statique), pas de framework JS (Vue/React...), TypeScript dans les scripts inline, Leaflet pour la carte, `@astrojs/sitemap`.

## Modèle de contenu

Deux collections Astro (`src/content.config.ts`), lues depuis `src/content/` :

### `projets` — un seul schéma Zod partagé, deux dossiers dans le CMS

- `src/content/projets/Commandes/*.md` — collection Pages CMS **"Projets — Commandes"**
- `src/content/projets/Créations/*.md` — collection Pages CMS **"Projets — Créations"**
- Le rangement en dossiers est **purement organisationnel** côté CMS. Le `id` Astro (donc l'URL `/projets/<id>`) est généré à partir du **nom de fichier seul** (`generateId` custom dans `content.config.ts`), jamais du dossier — donc déplacer un fichier entre dossiers ne casse jamais son URL.
- Champs du schéma (tous optionnels sauf `titre`/`categorie`) : `titre, categorie(commandes|creations), client, role, date, annee, genre, duree, couverture, lieu, latitude, longitude, description, video, image1, image2, image3`.
- **Champs exposés dans le CMS Commandes** : titre, role, client, date, couverture, image1-3, video, lieu, latitude, longitude, body (rich-text).
  - `role` + `client` → affichés combinés ("Rôle pour Client") sur la home et la fiche projet.
  - `date` pilote le tri de la home (plus récent en haut).
  - `lieu` (ou `latitude`+`longitude` en override manuel) → géocodé automatiquement et affiché sur la carte "Autour du monde", **peu importe la catégorie**.
  - `video` → URL YouTube/Vimeo/autre, convertie en iframe responsive sur la fiche projet.
  - `image1/2/3` → galerie de 3 photos supplémentaires sur la fiche projet, en plus de la couverture.
- **Champs exposés dans le CMS Créations** : titre, annee, genre, duree, couverture, description, image1-3.
  - `annee` pilote le tri de la page Créations (plus récente en haut).
  - `annee · genre · duree` affichés en ligne de métadonnées.
  - Les créations s'affichent **empilées directement sur la page** (façon blog), pas de clic vers une fiche séparée — mais la fiche `/projets/<id>` existe quand même et reste accessible par URL directe.
  - Client/Rôle/Date/Lieu/Vidéo ne sont **volontairement pas exposés** pour Créations (demandé explicitement) — le schéma les accepte quand même si jamais besoin plus tard.
- **Ni Commandes ni Créations n'ont de champ "Ordre"** — il a été retiré (mort, plus utilisé depuis le passage au tri par date/année).

### `carnet` — `src/content/carnet/*.md`

Champs : `titre, date, extrait, couverture, brouillon`. Simple, symétrique CMS/schéma. Le carnet n'a actuellement qu'**une seule entrée** ("C'est un nouveau site").

## Pages (`src/pages/`)

| Route | Fichier | Contenu |
|---|---|---|
| `/` | `index.astro` | Home = "Commandes". Signature animée (4 phrases en fondu), onglets, liste des projets Commandes (accroche en gras + rôle/client dessous), triée par date décroissante. |
| `/creations` | `creations.astro` | Créations empilées façon blog (images + titre + description), pas de lien cliquable, triées par année décroissante. |
| `/autour-du-monde` | `autour-du-monde.astro` | Carte Leaflet (tracé au trait, sans tuiles), un point par lieu géocodé automatiquement depuis le champ Lieu de **n'importe quel** projet (Commandes ou Créations). Clic sur un point → popup listant le(s) projet(s) à cet endroit. |
| `/projets/[slug]` | `projets/[slug].astro` | Fiche détail, partagée Commandes/Créations : couverture, titre, méta (rôle/client, date/année, genre, durée), vidéo embed, corps (rich-text), galerie 3 photos. |
| `/carnet` | `carnet/index.astro` | Liste du carnet. |
| `/carnet/[slug]` | `carnet/[slug].astro` | Article de carnet. |
| `/a-propos` | `a-propos.astro` | **Placeholder** ("À rédiger.") — accessible via le menu hamburger. Contenu à écrire par Alexandre (je n'ai pas inventé de bio). |
| `/booking` | `booking.astro` | Formulaire "Demande de tournage" (maquette fournie par Alexandre). Voir section Booking ci-dessous. |

## Layout partagé (`src/layouts/Layout.astro`)

- Header : logo "Alexandre Berger / Réalisateur" (cliquable → `/`), aligné à gauche. Bouton "Booking" + hamburger en haut à droite (empilés sur leur propre ligne sous 600px pour éviter le chevauchement mobile).
- Menu secondaire (hamburger) : Carnet, À propos.
- Onglets principaux : Commandes / Créations / Autour du monde.
- Footer : "Ils m'ont fait confiance pour fabriquer leurs films" + liste de clients triée alphabétiquement (12 clients actuellement).
- Bande pleine largeur sous le footer : texte de présentation (statique, dans `Layout.astro`) à gauche + dernière entrée du carnet à droite, tous deux centrés. Le lien "dernière entrée" renvoie vers `/carnet` (pas l'entrée individuelle — un lien direct posait un bug non reproduit localement).

## Design system

- Fond quasi-noir `#0b0b0b`, texte blanc, très centré (sauf le header, aligné à gauche).
- Police **Inter** via Google Fonts (pas encore auto-hébergée — TODO perf/SEO mentionné dans le CLAUDE.md original).
- Boutons/onglets/labels de métadonnées : monospace (`ui-monospace, "SF Mono", Menlo`), majuscules, letter-spacing.
- Titres d'accroche/création : gras (700).
- Boutons bordés qui s'inversent (fond blanc / texte noir) au survol : `.booking-btn`, `.menu-toggle`, bouton submit du formulaire Booking.
- Transitions ≤ 150ms partout.
- Astro View Transitions (`<ClientRouter />`) actif : header/footer/bandeau `transition:persist`.

## Décisions techniques importantes (pour éviter de refaire les mêmes erreurs)

1. **Jamais `image()` de `astro:assets` ou `.or(z.string())` sur un champ image.** Pages CMS écrit des chemins publics (`/uploads/...`) ; le pipeline d'assets d'Astro tente de les résoudre comme des imports locaux et **casse le build en production** (`ImageNotFound`) dès qu'une vraie image est uploadée. Tous les champs image sont `z.string().optional()` + rendu en `<img>` brut. C'est arrivé une fois en prod, corrigé depuis — ne pas réintroduire `image()`.
2. **Cache de géocodage** (`src/lib/geocode.ts`) : résout un `Lieu` texte en lat/lng via Nominatim/OpenStreetMap (1 req/s max), avec cache disque committé (`src/data/geocode-cache.json`). Le chemin du cache est résolu via `process.cwd()`, **pas** `import.meta.url` (qui pointe vers un dossier temporaire pendant `astro build` et casse silencieusement la persistance du cache).
3. **Carte "Autour du monde"** : le script d'init doit tourner sur `astro:page-load` (pas juste au chargement du module), sinon la carte ne se réaffiche plus après une navigation par transition (le JS ne se ré-exécute pas). Nettoyage sur `astro:before-swap`.
4. **Unicode NFC/NFD** : macOS + `git core.precomposeunicode` peuvent faire diverger l'encodage d'un nom de fichier accentué (uploads Pages CMS) entre le fichier réel et la référence dans le frontmatter. Un mismatch cassait le chargement d'image. Si un problème similaire réapparaît sur un fichier accentué, comparer les octets bruts (`os.listdir` en mode bytes en Python) plutôt que se fier à l'affichage terminal.
5. **Serveur de dev Astro** : peut rester périmé (collection vide en cache) après un `git pull`/déplacement de fichiers en dehors de son propre cycle de watch. Réflexe : le redémarrer si le contenu affiché ne correspond pas aux fichiers sur disque.
6. **`subfolders: true`** nécessaire dans `.pages.yml` pour qu'une collection Pages CMS supporte des sous-dossiers (utilisé nulle part actuellement, on a préféré deux collections séparées Commandes/Créations pour avoir des champs différents — Pages CMS ne permet pas des champs conditionnels selon une valeur dans une seule collection).

## SEO — état actuel (audit complet fait le 2026-08-17)

**Fait ce soir :**
- `astro.config.mjs` : `site` défini, intégration `@astrojs/sitemap` (génère `/sitemap-index.xml`).
- `public/robots.txt` ajouté.
- `<head>` (`Layout.astro`) : canonical, `og:url`, Twitter Card (`summary`), favicon explicite (svg + ico).
- H1 sur toutes les pages (invisible/`sr-only` là où un titre visible casserait la mise en page existante : home, Créations, Autour du monde, Carnet ; visible pour À propos).
- Description meta de la fiche projet : utilise le champ `Description` du projet quand il est rempli, au lieu d'un texte générique dupliqué sur toutes les fiches.
- Nettoyage du champ `ordre` (mort).

**Reste à faire / décisions à prendre :**
- **`og:image`** : pas d'image de partage social configurée (nécessite une image dédiée 1200×630, à fournir/valider par Alexandre — je n'en ai pas fabriqué).
- **Domaine définitif** : mettre à jour `site` dans `astro.config.mjs` dès que `alexandreberger.com` est branché sur Vercel.
- **Police Inter** : toujours chargée depuis Google Fonts, pas auto-hébergée (mentionné comme TODO dès le début du projet).
- **Contenu À propos** : page encore vide ("À rédiger.") — les meta tags promettent du contenu ("parcours, démarche...") que la page ne délivre pas encore.
- Le repo GitHub est **public** — pas un problème en soi, juste à avoir en tête (le `.pages.yml`, le code, tout est visible publiquement).

## Page Booking — état et limite connue

Formulaire complet (`src/pages/booking.astro`) reproduisant la maquette fournie : Entreprise/Institution/Structure, Nom, Prénom, Fonction/Service, Email, Téléphone, Type de projet, Durée du tournage, Date souhaitée, Lieu, Budget estimé, Description du projet.

**Pas de vrai backend.** Le site est 100% statique (pas de serveur, pas d'API). Au clic sur "Envoyer la demande", le formulaire construit un lien `mailto:` pré-rempli vers `alexandrebrgr@gmail.com` et l'ouvre. Ça fonctionne mais dépend que le visiteur ait un client mail configuré sur son appareil, et il n'y a aucun accusé de réception ni trace du côté serveur.

**Si un formulaire "pro" est voulu** (soumission qui fonctionne sans ouvrir de logiciel mail, avec confirmation) il faudra choisir une solution : un service tiers de formulaires (ex. Web3Forms, Formspree — gratuit, pas de backend à héberger) ou une vraie fonction serverless Vercel + service d'envoi d'email (ex. Resend). C'est une décision à prendre avec Alexandre (coût, complexité, dépendance à un tiers), pas tranchée ce soir.

## Pense-bête workflow

- Toujours `git fetch` + vérifier `main..origin/main` avant de pousser (le CMS committe en continu pendant qu'on travaille).
- Build de contrôle avant chaque push : `npm run build` (puis `rm -rf dist`, le dossier n'est pas commité).
- Pour tester une modif avec de vraies données sans polluer le contenu réel : copier le `.md` concerné, éditer, tester, puis restaurer la copie avant de committer.
- Redémarrer le serveur de dev (`preview_start` avec la config `astro-dev` de `.claude/launch.json`) si le contenu affiché semble périmé par rapport aux fichiers.

## Historique

96 commits sur `main` à ce jour. Tout le travail de ce soir (config Pages CMS initiale → collections séparées → carte du monde → géocodage auto → page Créations en blog → page Booking → passe SEO) est dans l'historique git, consultable avec `git log --oneline`.
