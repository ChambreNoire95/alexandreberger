{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # alexandreberger.com \'97 vitrine\
\
## Contexte\
Site vitrine d'Alexandre Berger, r\'e9alisateur freelance (\'cele-de-France), en Astro.\
Priorit\'e9 n\'b01 : le SEO / r\'e9f\'e9rencement organique (redevenir n\'b01). Astro a \'e9t\'e9 choisi\
pour son HTML rendu au build, meilleur pour Google qu'une SPA.\
\
## Direction artistique (= template \'e0 d\'e9cliner sur les autres sites)\
- Home fa\'e7on "g\'e9n\'e9rique de film" : fond quasi-noir #0b0b0b, texte blanc, tout centr\'e9.\
- Police Inter (via Google Fonts pour l'instant ; \'e0 auto-h\'e9berger plus tard pour la perf/SEO).\
- Signature : plusieurs phrases qui alternent toutes les 5 s en fondu, Inter bold blanc.\
- Onglets + bouton "En savoir +" : typo monospace, capitales, letter-spacing,\
  bouton bord\'e9 qui s'inverse (fond blanc / texte noir) au survol.\
- Animations \uc0\u8804  150 ms.\
\
## Structure de la home \'97 src/pages/index.astro\
1. Header : "Alexandre Berger" + ligne "R\'e9alisateur".\
2. Phrases signatures qui tournent.\
3. 3 onglets : Commandes (= la home, href="/"), Cr\'e9ations (/creations), Autour du monde (/autour-du-monde).\
4. Accroches projet = contenu de Commandes (boucle sur le tableau `projets`).\
5. Bouton "En savoir +" \uc0\u8594  /a-propos.\
6. Footer : clients en texte.\
(Les accroches et clients r\'e9els sont d\'e9j\'e0 dans index.astro.)\
\
## R\'e8gles \'e0 respecter\
- NE PAS toucher aux slugs d'URL des projets : ils portent des mots-cl\'e9s SEO\
  (mosaert-stromae, paludiers-sel...). Le texte affich\'e9 peut diff\'e9rer du slug.\
- Garder les m\'e9tas SEO (title, description, og:) riches en mots-cl\'e9s :\
  "r\'e9alisateur", "documentaire, fiction, film de marque", "\'cele-de-France", "r\'e9alisateur freelance".\
\
## \'c0 faire\
- Cr\'e9er les pages /creations, /autour-du-monde, /a-propos et /projets/[slug] (aujourd'hui en 404).\
- Plus tard : auto-h\'e9berger Inter, d\'e9ployer sur Vercel, page de vente s\'e9par\'e9e.}