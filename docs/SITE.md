# alexandreberger.com — Documentation du site vitrine

> Document de référence pour travailler sur le **site**. À lire en début de discussion.
> Dernière mise à jour : 6 octobre 2026. Voir §14 pour l'état du déploiement.
> En cas de contradiction avec `CLAUDE.md`, **ce document est plus récent** (CLAUDE.md est un fichier RTF qui vieillit).

---

## 0. Règles d'or (à respecter en toutes circonstances)

1. **Ne jamais toucher aux slugs d'URL des projets** (ils portent des mots-clés SEO : `mosaert-stromae-bon-marche`, `paludiers-sel-guinee-bissau`…). Le texte affiché peut différer du slug.
2. **Commit / push uniquement quand Alexandre le demande explicitement** (« commit et push »). Jamais de push spontané.
3. **Modifications de style : desktop uniquement par défaut**, sauf si Alexandre écrit « mobile ». (Règle répétée plusieurs fois.)
4. **Toujours tester avant de livrer** : `npm run build` + vérification visuelle dans le navigateur intégré (jamais « ça devrait marcher »). Après un changement de schéma/config : redémarrer le serveur de dev **et** supprimer `.astro/data-store.json`.
5. **Regrouper les pushs** : Vercel limite à ~100 déploiements / 24 h et Pages CMS en déclenche déjà beaucoup. Un push = un déploiement.
6. Garder des **métas SEO riches** : « réalisateur », « documentaire, fiction, film de marque », « Île-de-France », « réalisateur freelance » (et « director and filmmaker » côté EN).
7. Ne pas répéter ce qui est déjà décidé : relire §12 (décisions) avant de proposer une alternative.

---

## 1. Contexte

Site vitrine d'**Alexandre Berger**, réalisateur freelance (Île-de-France), en français avec une **version anglaise complète sous `/en/`**. **Priorité n°1 : le référencement organique** → Astro, HTML rendu au build. Le contenu (fiches projets, carnet) est géré dans **Pages CMS** (CMS headless basé sur GitHub) qui **commite directement dans ce dépôt** : s'attendre à des commits « (via Pages CMS) » très fréquents, y compris en pleine session.

- Production : **https://www.alexandreberger.com** (domaine principal Vercel ; `alexandreberger.com` redirige vers `www`).
- Dépôt : GitHub `ChambreNoire95/alexandreberger`, branche `main`.
- Langue de travail avec Alexandre : français.

---

## 2. Stack et déploiement

- **Astro 7**, `output: 'server'` + adaptateur `@astrojs/vercel`, mais **toutes les pages ont `export const prerender = true`** (site statique). Seules les routes `src/pages/api/*.ts` sont de vraies fonctions serveur : `booking`, `rappel`, `contact` (e-mails via **Resend**).
- `site: 'https://www.alexandreberger.com'` dans `astro.config.mjs` (URLs canoniques + sitemap). Si le domaine principal change : changer cette ligne **et** le `Sitemap:` de `public/robots.txt`.
- `build.inlineStylesheets: 'auto'`. Transitions de page : `ClientRouter` (header, footer, bandeau en `transition:persist`).
- Markdown : processeur **Sätteri** (`@astrojs/markdown-satteri`) avec un plugin hast maison (`src/lib/rehype-galerie.mjs`) : trois images consécutives ou plus dans un texte deviennent automatiquement une grille.
- Sitemap : `@astrojs/sitemap` avec `i18n` (fr-FR / en-GB, balises hreflang).
- Déploiement : push sur `main` → Vercel. Vérifier le statut avant d'annoncer « en ligne » :
  `gh api repos/ChambreNoire95/alexandreberger/commits/$(git rev-parse HEAD)/status --jq '.statuses[0].state'` (attendre `success`).

### Variables d'environnement (Vercel + `.env` local, voir `.env.example`)
| Variable | Rôle |
|---|---|
| `RESEND_API_KEY` | clé Resend (obligatoire ; sans elle les API répondent 500 « service non configuré ») |
| `RESEND_FROM` | expéditeur, ex. `Alexandre Berger <booking@alexandreberger.com>` ; nécessite un **domaine vérifié** dans Resend, sinon `onboarding@resend.dev` ne peut écrire qu'au propriétaire du compte |
| `BOOKING_NOTIFY_EMAIL` | adresse qui reçoit les notifications (défaut `alexandrebrgr@gmail.com`) |

### Commandes
```
npm run dev       # serveur de dev (lance d'abord scripts/optimize-images.mjs) — dans le navigateur intégré : preview_start « astro-dev » (.claude/launch.json, port 4321)
npm run build     # build de production (lance aussi optimize-images)
```

---

## 3. Arborescence utile

```
.pages.yml                       Configuration Pages CMS (collections, champs)
astro.config.mjs                 site, sitemap (i18n), markdown (Sätteri + galerie), vercel
docs/                            Ces documents
public/
  fonts/Archivo-wdth.woff2       Archivo variable (axes poids + largeur), + Inter auto-hébergé (2 fichiers variables)
  uploads/                       Images du CMS ; uploads/_optimise/ = dérivées WebP/AVIF COMMITÉES
  robots.txt  og-default.jpg  favicon.*  world.geo.json
scripts/optimize-images.mjs      Génère les variantes d'images (cache par hash du contenu)
src/
  content.config.ts              Collections : projets, carnet, projetsSatellites, projetsEn, carnetEn
  content/
    projets/Commandes|Créations/ Fiches FR (Markdown + frontmatter)
    projets-en/Commandes|Créations/  Textes EN (même nom de fichier que la fiche FR)
    carnet/  carnet-en/          Entrées du carnet FR / EN
    settings/                    carrousel.json (ordre), bande-demo.json (demoreel)
  data/geocode-cache.json        Cache de géocodage (carte « Autour du monde »)
  i18n/index.ts                  langDe(), url(), t(), libellés (types, univers, critères…), dates
  i18n/ui.ts                     Dictionnaires fr/en (toutes les chaînes de l'interface)
  layouts/Layout.astro           Head SEO, header, footer, bandeau, styles globaux (variables CSS)
  components/                    LogoFormats, CarrouselHome, Signature, TitreSwitch, OptimizedImage
  lib/                           contenu.ts (fusion FR+EN), carrousel.ts, creneau.ts, geocode.ts, meta.ts,
                                 video.ts, positionTitre.ts, image-config.mjs, rehype-galerie.mjs
  pages/[...lang]/               TOUTES les pages (route optionnelle : sans préfixe = FR, `en` = EN)
  pages/api/                     booking.ts, rappel.ts
  pages/_projets-satellites/     Désactivé (préfixe _ = non routé)
```

---

## 4. Internationalisation (FR par défaut, EN sous `/en/`)

- **URLs** : le français reste à la racine (inchangé) ; l'anglais est sous `/en/` **avec les mêmes slugs** (`/en/projets/mosaert-stromae-bon-marche`).
- Routage : `src/pages/[...lang]/…` ; chaque page définit `getStaticPaths` (soit `cheminsLangues()` pour les pages simples, soit une boucle sur `LANGUES` écrite **en ligne** dans `getStaticPaths` — Astro isole cette fonction, elle ne peut pas appeler de fonction du module).
- Helpers (`src/i18n/index.ts`) : `langDe(Astro.params)`, `url(lang, "/chemin")`, `sansLangue(path)`, `autreLangue(lang)`, `t(lang, "cle")` (repli FR si clé EN absente), `libelle(lang, categorie, valeur)`, `libellesRecherche(lang)`, `dateFormatee`, `roleAffiche`.
- **Toute chaîne d'interface** vit dans `src/i18n/ui.ts` (objets `fr` et `en`). Les listes du CMS (types de film, univers, critères, rôles) gardent leur valeur FR en base ; l'affichage EN passe par les tables de `i18n/index.ts`.
- **Textes de fiches EN** = collections séparées dans Pages CMS (`projets-commandes-en`, `projets-creations-en`, `carnet-en`) ; **un fichier EN par fiche FR, même nom de fichier** (association par nom de fichier, `src/lib/contenu.ts`). Champ vide ou fichier manquant → repli sur le français. Les **titres de films** (`titreFilm`, titre des Créations) restent dans leur langue d'origine : seuls descriptions, accroches, alts et corps sont traduits. Les 27 films de commande, 19 créations et 2 entrées de carnet ont une traduction **rédigée par Claude, à relire par Alexandre** (en cours de relecture dans Pages CMS).
- **Sélecteur de langue** : bouton carré dans la barre du header (affiche la langue *vers laquelle* on bascule : « EN » sur le site FR). **Pas de redirection automatique** (choix d'Alexandre). Il utilise `data-astro-reload` (rechargement complet) car le header est persistant ; un script `majLangues()` recalcule son lien à chaque navigation. Liens relatifs (pas d'URL de prod en dur).
- SEO : `<html lang>`, canonical par langue, `hreflang` fr/en/x-default (URLs absolues), `og:locale`, sitemap bilingue.
- **Typographie française** : dans `ui.ts` (bloc `fr`), `« : »`, `« ? »`, `« ! »`, `« ; »` et les guillemets français sont précédés d'une **espace insécable** (U+00A0 / U+202F) pour qu'un signe de ponctuation ne se retrouve jamais seul en début de ligne. À respecter pour tout nouveau texte FR (ainsi que `*` collé au libellé). Pour le **contenu du CMS** (fiches, carnet), la correction est **automatique au rendu**, sans toucher aux fichiers : `src/lib/typo-fr.mjs` (fonction `typoFr`, qui ne fait que remplacer une espace déjà présente), appliquée aux champs texte dans `src/lib/contenu.ts`, aux extraits tirés du corps dans `src/lib/meta.ts`, et au corps Markdown par le plugin `src/lib/rehype-typo-fr.mjs` (dossiers français uniquement). Après modification de ce plugin : supprimer `.astro/data-store.json`.
- Chaînes encore écrites en dur (hors dictionnaire) : le contenu de `a-propos.astro` (objets fr/en inline), `mentions-legales.astro` (blocs FR et EN séparés), la liste des clients du footer (noms propres).

---

## 5. Contenu et Pages CMS (`.pages.yml`)

Entrées actuelles : `carrousel-ordre`, `bande-demo`, `projets-commandes`, `projets-commandes-en`, `projets-creations`, `projets-creations-en`, `carnet`, `carnet-en`, `projets-satellites` (désactivé côté site).

- **Pas de helper `image()` d'Astro** dans les schémas : Pages CMS écrit des chemins publics (`/uploads/...`), tous les champs image sont de simples `z.string()`.
- `projets` : `generateId` ignore le sous-dossier Commandes/Créations et prend le champ `slug` (s'il existe) sinon le nom de fichier → **slug d'URL stable**. `categorie: commandes | creations`.
- Champs notables d'une fiche : `titre` (étiqueté « Accroche » dans le CMS — historique), `accroche` (aperçu au survol), `titreFilm`, `client`, `role`, `type`, `date`, `duree`, `secteurs` (Univers) et `besoins` (Critères) (filtres de la page d'accueil), `couverture`(+`Alt`), `image1..3`(+`Alt`), `video`, `lieu` (+ `latitude/longitude` forcées) → carte, `carrousel` + `carrouselTitre` + `carrouselImage`, `enChantier`, `brouillon` (404 + retrait des listes).
- **Config CMS périmée** : après toute modification de `.pages.yml`, vérifier que les nouveaux champs apparaissent dans Pages CMS **avant** d'enregistrer une fiche (sinon un champ inconnu peut être effacé).
- **Piège récurrent du carrousel** : `carrouselImage` prime sur `couverture`. Si une image est remplacée mais que l'ancien nom reste dans `carrouselImage`, le fichier n'existe plus → le carrousel « ne se met pas à jour ». Vérifier que chaque `couverture` / `carrouselImage` pointe un fichier présent.
- En cas de conflit git sur un fichier de contenu : **toujours préserver le contenu réel ajouté par Pages CMS**.

---

## 6. Images

`scripts/optimize-images.mjs` (via `sharp`, lancé par `predev` / `prebuild`) génère pour chaque image de `public/uploads/` des variantes **480 / 640 / 960 px en WebP + AVIF** dans `public/uploads/_optimise/`, consommées par `src/components/OptimizedImage.astro` (`<picture>`, repli sur l'original). Config partagée script ↔ composant dans `src/lib/image-config.mjs` (ne jamais les désynchroniser). `manifest.json` stocke aussi les dimensions réelles (width/height HTML → pas de CLS).

- Cache par **hash du contenu** (pas la date) ; les dérivées sont **commitées**. **Après un build qui crée de nouvelles dérivées : les committer** (`git add public/uploads/_optimise`) avant de pousser, sinon Vercel les régénère toutes (~7 min).
- Sources calibrées 960×1280 (portrait), pas de palier au-delà de 960.
- Piège Astro : les styles scopés d'un parent ne s'appliquent pas aux éléments rendus par un composant enfant → `:global()` sur la partie qui vise l'intérieur (déjà fait partout où `OptimizedImage` est utilisé).

---

## 7. Design system

- **Couleurs** (variables dans `Layout.astro`) : fond **noir pur** ; `--blanc: #F1EEE8` (+ `--blanc-rgb`) pour tous les éléments clairs ; `--rouge: #AD1100` (une seule variable, y compris le compteur du logo). Hover standard : fond rouge + texte blanc (boutons, filtres, bouton de recherche) ; boutons à liseré : liseré rouge + texte blanc.
- **Typographie** : **Archivo variable** (auto-hébergée, axes poids + largeur) pour l'interface avec `--largeur-police: 85%` (appliqué via `font-stretch` à `body, button, input, select, textarea`) ; **Inter regular** pour les paragraphes de texte (`--police-texte`) ; flèches (`→ ←`) en Inter. Libellés techniques en Archivo très léger (graisse ~200). Correctif Safari `-webkit-text-size-adjust` inliné en `<style>` brut dans le `<head>` (le minifieur Vite le supprimerait sinon).
- **Logo animé** `src/components/LogoFormats.astro` : un cadre qui change de format (1:1, 4:3, 16:9, 2.39 SCOPE, 9:16), nom recomposé à chaque format, texte **RÉALISATEUR** / **DIRECTOR** (prop `lang`) suivi d'un **« + » rouge dessiné en CSS** (hauteur des capitales, trait de l'épaisseur des lettres, espacement des lettres ; tout en `em`). La phrase d'accroche du header change en même temps que le format (`Signature.astro`, taille doublée sur desktop : `clamp(2.64rem, 6.24vw, 5.14rem)` ; durée par format ≈ 3,4 s, aléatoire 3,5–6,5 s pour l'alternance de phrases, jamais deux fois la même d'affilée). Sur **mobile** : écran d'accueil plein écran avec le logo centré, une **flèche animée vers le bas** (`#splash-fleche`, en bas d'écran) invite à défiler : un premier geste de défilement vers le bas (glissement du doigt vers le haut de plus de 24 px, molette, flèche bas / page suivante / espace) fige le logo en haut de page sur « 2.39 SCOPE » sans cadre ni compteur et révèle le site (un simple toucher ne fait plus rien, hors la flèche elle-même qui sert de bouton pour l'accessibilité). **Arrivée directe sur une autre page que l'accueil** (lien Google, lien partagé, nouvel onglet) : pas d'écran d'accueil, le logo est figé d'emblée sur « 2.39 SCOPE » (script inline de `Layout.astro`, qui pose `logo-fige-index = 3` en `sessionStorage`).
- **Header** : logo à gauche ; à droite **barre segmentée `Films | EN | ☰`** (un seul cadre fin, séparateurs verticaux, survol blanc/noir par segment) + **bouton Booking rouge** à part. Le menu déroulant (Carnet, Autour du monde, À propos) est ancré sous la barre. Sur mobile « Films » rejoint le menu : reste `Booking` puis `EN | ☰` ; **espace de 2,5 rem sous le header** pour que titres de pages et phrases ne collent pas aux boutons (annulé pendant l'écran d'accueil).
- **Accueil** : phrases qui tournent → **carrousel** (cartes portrait 3:4, défilement infini dans les deux sens, boutons précédent/suivant **ronds avec « + » rouge dessiné en CSS**, desktop uniquement ; identique sur `/` et `/creations` ; `fetchpriority="high"` sur les 2 premières images ; ordre géré dans le CMS « Ordre du carrousel ») → **texte de présentation** pleine largeur (`Presentation.astro`, accueil et Créations ; desktop : sans filets, 9 rem d'espace de chaque côté ; mobile : entre deux filets) → bascule de titre **Films de commande** (calé à gauche) **/ Créations** (calé à droite) (`TitreSwitch.astro` ; desktop : police des phrases du header à 35 % de leur taille, sans capitales forcées, alignés sur les bords du contenu qui suit via la prop `largeur` (1240 px sur l'accueil, 910 px sur Créations) ; au clic, la page arrive **au-dessus du carrousel avec 100 px de marge** (`scrollerVersCarrousel` dans `src/lib/positionTitre.ts`) ; le titre de la page est blanc, l'autre est un lien grisé, blanc au survol, avec une flèche rouge vers son côté ; mobile : seul le titre de la page, centré, ancien style) → **zone de filtres** sous le titre (`.filtres-zone`, entre deux filets : trois rangées **Type de film / Univers / Critères**, chacune avec un bouton « Tous ») → liste des films (au survol : panneau d'aperçu) + encart **Demoreel** (vidéo en pop-up). Les filtres **se croisent** : type et univers à choix unique, critères cumulables (le film doit tous les porter) ; un bouton qui ne mènerait à aucun film est grisé ; les valeurs proposées sont celles portées par au moins un film. Lus dans `data-type`, `data-univers`, `data-criteres` de chaque `<li>` (`setupFiltres()` dans `index.astro`). La fenêtre « Trouvez les références adaptées à vos besoins » (et les filtres Format/Durée, Ton, « Ne pas faire remonter ») a été **supprimée**, côté site comme côté CMS ; les filtres Genre/Rôle de la page Créations n'ont pas changé.
- **Footer** : « Ils m'ont fait confiance pour fabriquer leurs films » → **logos blancs des références** (grille flex centrée, texte alternatif « {nom}, client d'Alexandre Berger, réalisateur »), dernière entrée du carnet (la présentation n'est plus dans le footer : elle est sous le carrousel). Sur desktop, ces deux titres sont agrandis de 15 %.
  - Liste des références : `scripts/logos/clients.json` (nom, fichier source, mode de conversion). Sources dans `scripts/logos/sources/`. **`node scripts/generer-logos.mjs`** (à la main, pas au build) produit `public/logos/*.png` (blanc sur transparent) et `src/data/logos-clients.json` (dimensions d'affichage à surface visuelle constante), lu par `Layout.astro`. Une référence sans `fichier` reste en texte en fin de liste. Champ `url` : site officiel, chaque logo y renvoie dans un nouvel onglet (`rel="noopener nofollow"`, car le lien est présent sur toutes les pages). Champ facultatif `echelle` (ex. `1.15`) pour agrandir un logo peu lisible (détails fins, petit texte). **L'ordre de `clients.json` est l'ordre d'affichage : par notoriété décroissante** (marques les plus connues d'abord, pour le démarchage) — ne pas retrier par ordre alphabétique. Pour ajouter un logo : déposer le fichier dans `sources/`, compléter `clients.json`, relancer le script, committer les PNG.
- **Formulaire de contact du pied de page** (`.pied` dans `Layout.astro`, toutes les pages, avant le copyright) : Prénom, Nom, Structure, Fonction, Email, Téléphone (tous obligatoires) → `src/pages/api/contact.ts` (notification à Alexandre + confirmation au visiteur dans sa langue, honeypot `site`). **Mis en avant** : titre en gras « → Parlons de votre projet » (flèche rouge), **bouton d'envoi rouge** (blanc au survol) ; le cadre (liseré + fond gris) a été retiré sur desktop, conservé sur mobile. Le récapitulatif du menu a été supprimé (décision d'Alexandre). Bandeau (présentation, carnet) et formulaire sont réunis dans `.niveaux` : **deux blocs (carnet, formulaire) sur une seule ligne à partir de 1200 px**, l'un sous l'autre en dessous. `transition:persist` est porté par `.niveaux`. L'envoi est écouté sur `document` **en phase de capture**, sinon le ClientRouter soumet le formulaire en GET (coordonnées dans l'adresse).
- **Fiches projet** (`projets/[slug].astro`) : cover, métadonnées (rôle, date, durée), vidéo (YouTube/Vimeo/Vidéas via `src/lib/video.ts`), photos, texte, projet suivant ; JSON-LD `VideoObject` / `CreativeWork`. Autres JSON-LD : `Person` partout (Layout), `BlogPosting` (carnet).
- Pages : `/` · `/creations` · `/projets/<slug>` · `/carnet` · `/carnet/<slug>` · `/autour-du-monde` (carte Leaflet, positions géocodées et mises en cache) · `/a-propos` · `/mentions-legales` · `/booking`.

---

## 8. Page Booking et API associées

`src/pages/[...lang]/booking.astro` (+ `src/pages/api/booking.ts`, `src/pages/api/rappel.ts`, `src/lib/creneau.ts`).

- **Deux formulaires** : (1) **demande complète** (entreprise, nom, prénom, **fonction / service obligatoire**, e-mail, téléphone, type de projet, durée, date, lieu, budget, références, description) ; (2) **« Vous préférez être rappelé ? »** (prénom + nom, fonction + structure *obligatoire*, téléphone, **e-mail obligatoire**, Quand = date + heure).
- **Desktop (≥ 901 px)** : deux colonnes **2/3 – 1/3**, le petit formulaire dans un cadre (fond noir 90 %, liseré fin, flèche rouge avant le titre centré). Les cases de réponse des deux formulaires sont **alignées au pixel** : un script mesure l'écart entre les premiers champs et règle `--decalage` (espace sous le titre) à chaque redimensionnement.
- **Mobile / < 901 px** : **étape de choix** (« Contactez-moi en remplissant un formulaire complet » / « Demandez à être rappelé ») ; attribut `data-mode` = `choix | complet | rappel`, lien « ← Autre façon de me contacter ». Arrivée avec des références sélectionnées → direct sur le formulaire complet ; `/booking#rappel` ouvre directement le rappel ; sans JS, les deux formulaires s'empilent.
- Bouton d'envoi : **toujours en gras**, rouge + texte blanc au survol. Sélecteur d'heure du rappel : **liste déroulante par pas de 15 min, 08h00–20h00 (heure de Paris)** générée par `heuresRappel()` ; date minimale = aujourd'hui.
- Le bloc « références » de Booking (sélection mémorisée en `sessionStorage`, clé `references-booking`) n'est plus alimenté depuis que la fenêtre de recherche a été supprimée : le code de lecture est conservé mais reste inactif.
- **`/api/booking`** : valide, envoie (1) la notification à Alexandre, (2) une confirmation HTML au visiteur dans sa langue ; honeypot `site` ; messages d'erreur FR/EN ; la notification reste en français avec la mention « site en anglais ».
- **`/api/rappel`** : même principe, notification à Alexandre (+ `replyTo` visiteur) et confirmation au visiteur (si elle échoue, la demande reste valide). Validation du téléphone, de l'e-mail et du créneau (`src/lib/creneau.ts`).

---

## 9. SEO (rappel)

Titres/descriptions riches et par langue (`ui.ts`), canonical, hreflang, `og:*`, sitemap bilingue, JSON-LD, images en `<picture>` avec dimensions, polices auto-hébergées, HTML statique. Les pages brouillon utilisent la prop `noindex` du Layout.

---

## 10. Workflow git (important à cause de Pages CMS)

1. `git add <fichiers précis>` + `git commit` en local (message en français, se terminant par la ligne `Co-Authored-By` demandée par l'environnement). **Jamais de push direct sans commit local propre.**
2. `git pull --rebase origin main` (quasi toujours des commits Pages CMS en attente).
3. `npm run build` (et regénération des images si de nouveaux visuels sont arrivés).
4. Commiter les nouvelles dérivées `public/uploads/_optimise/` si le build en a créé.
5. `git push origin main`, puis vérifier le statut Vercel (§2).

---

## 11. Avant de committer

Toujours lire `git status` puis **committer des fichiers précis** (`git add chemin/precis`), pas `git add -A` à l'aveugle : l'arbre de travail peut contenir des modifications non terminées ou des commits Pages CMS récents. Faire `git pull --rebase origin main` avant de pousser.

---

## 12. Décisions déjà prises (ne pas rediscuter sans raison)

- Architecture EN : `/en/` + mêmes slugs, collections de textes EN séparées dans le CMS, sélecteur de langue sans redirection automatique.
- Rouge unique `#AD1100` ; blanc `#F1EEE8` ; fond noir pur ; Archivo (largeur 85 %) + Inter pour les textes ; flèches en Inter.
- Logo : texte **DIRECTOR** (pas « Filmmaker »), « + » rouge ; « filmmaker » ajouté dans les métas EN.
- Header : barre segmentée `Films | langue | burger`, sans soulignement sur Films, Booking rouge séparé.
- Carrousel : boutons « + » ; défilement infini ; identique sur `/` et `/creations`.
- Booking : deux formulaires (2/3 – 1/3), étape de choix sur mobile, Fonction obligatoire partout, e-mail obligatoire dans le rappel.
- Les titres de films ne se traduisent pas.

---

## 12 bis. Pièges techniques connus

- **Serveur de dev périmé** après changement de schéma/config : redémarrer + `rm .astro/data-store.json`.
- **Styles scopés Astro** : un élément créé en JavaScript n'a pas l'attribut de scope → utiliser `:global()` (`.parent :global(.enfant)`).
- **`getStaticPaths`** est isolé : pas d'appel à une fonction du module parent.
- **ClientRouter** réinitialise les attributs de `<html>` au changement de page ; le header persistant garde l'ancien DOM → d'où `data-astro-reload` pour la langue.
- **`scroll-behavior: smooth`** (CSS) s'applique à toute écriture de `scrollLeft` : le repositionnement du carrousel infini force `scroll-behavior:auto` le temps du saut.
- **Pages CMS** réécrit le contenu en Markdown simple (supprime les blocs HTML manuels) → d'où la grille d'images automatique.
- **Resend** : sans domaine vérifié, les e-mails ne partent qu'à l'adresse du compte.
- Les captures d'écran du navigateur intégré sont petites ; pour contrôler un détail, mesurer avec `javascript_tool` (`getBoundingClientRect`) plutôt que de deviner.
- Le logo `LogoFormats` calcule sa propre mise en page : ne pas changer sa variable `--s` à la volée (il se déforme).

---

## 13. Comment tester

- Build : `npm run build` (doit se terminer par « Complete! »).
- Visuel : `preview_start` « astro-dev » puis navigateur intégré ; redimensionner avec `resize_window` (`mobile` 375×812, ou largeur personnalisée 1440×900) et **toujours remettre `desktop` après**.
- API e-mail **sans rien envoyer** (valable pour `booking.ts` et `rappel.ts`) : compiler la route avec un faux Resend, puis l'appeler directement.
  ```bash
  mkdir -p /tmp/t && cat > /tmp/t/resend-stub.mjs <<'EOF'
  export class Resend { constructor(){ this.emails = { send: async (m) => { globalThis.__sent.push(m); return {}; } }; } }
  EOF
  npx esbuild src/pages/api/rappel.ts --bundle --format=esm --platform=node --outfile=/tmp/t/api.bundle.mjs \
    --alias:resend=/tmp/t/resend-stub.mjs \
    --define:import.meta.env='{"RESEND_API_KEY":"x","BOOKING_NOTIFY_EMAIL":"owner@test.fr"}' --log-level=error
  # puis un script node : globalThis.__sent = []; const { POST } = await import("/tmp/t/api.bundle.mjs");
  # const r = await POST({ request: new Request("http://x", { method: "POST", body: JSON.stringify({ ...payload }) }) });
  # → r.status, await r.json(), globalThis.__sent (les e-mails qui seraient partis)
  ```
  Vérifier les cas valides (FR, EN) et les cas d'erreur : **toujours 0 e-mail sur une erreur**. Utiliser le dossier `scratchpad` de la session plutôt que `/tmp` si l'environnement l'impose.
- **Ne jamais soumettre un formulaire réel pendant les tests** (cela enverrait de vrais e-mails). Pour tester l'interface sans envoyer, remplacer `window.fetch` dans le navigateur intégré pour intercepter l'appel `/api/...`.

---

## 14. État actuel et à faire

- **Déployé** : tout jusqu'à `599781e` (version anglaise, header segmenté, logo « + », carrousel « + », page Booking à deux formulaires + étape de choix mobile).
- **Non commité** : rien.
- **À faire (site)** :
  - Relecture des traductions anglaises par Alexandre (dans Pages CMS, collections « (EN) »).
  - Test d'envoi réel des deux formulaires (notification + confirmation) ; vérifier le domaine d'envoi Resend (`RESEND_FROM`).
  - Format vertical 9:16 du logo en français : « RÉALISATEUR+ » finit à ~11 px du bord (serré mais dans le cadre) — réduire le mot pour ce format si cela gêne.
  - Mettre à jour `CLAUDE.md` si une règle change.
