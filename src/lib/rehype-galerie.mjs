// Plugin Markdown (moteur Sätteri d'Astro 7) pour les images saisies dans le texte d'une fiche ou du carnet.
//
// 1. Galerie : une suite de 3 images (ou plus) collées dans un texte devient automatiquement une grille.
//    - images en paysage : <div class="galerie-169"> (3 colonnes, recadrées en 16/9) ;
//    - images majoritairement en portrait : <div class="galerie-photos"> (3 colonnes, photos ENTIÈRES, sans recadrage :
//      pour les séries de photographies). Le choix se fait tout seul, d'après les dimensions réelles des fichiers.
//    Styles dans projets/[slug].astro.
//    Pourquoi : l'éditeur de texte de Pages CMS réécrit le contenu en Markdown simple et supprime les blocs HTML saisis
//    à la main (c'est arrivé à la fiche « 60 ans d'avenirs »). Il suffit d'enchaîner les images, une par paragraphe.
// 2. Poids : chaque image du texte reçoit ses variantes WebP (srcset), ses dimensions (pas de saut de page au chargement)
//    et un chargement différé. Sans cela, le navigateur téléchargerait les fichiers d'origine en pleine taille.
import { defineHastPlugin } from "satteri";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { LARGEURS_OPTIMISEES, cheminOptimise, cheminManifest, nomFichier, extensionOptimisable } from "./image-config.mjs";

const SEUIL = 3;
const TAILLES_GALERIE = "(max-width: 800px) 50vw, 300px";
const TAILLES_SEULE = "(max-width: 950px) 100vw, 910px";

const manifests = new Map();
function dimensionsDe(src) {
  if (typeof src !== "string" || !src.startsWith("/")) return undefined;
  const chemin = path.join("public", cheminManifest(src));
  if (!manifests.has(chemin)) manifests.set(chemin, existsSync(chemin) ? JSON.parse(readFileSync(chemin, "utf-8")) : {});
  return manifests.get(chemin)[nomFichier(src)];
}

/** Propriétés d'une image du texte, complétées : variantes WebP, dimensions, chargement différé. */
function optimiser(proprietes, tailles) {
  const src = proprietes?.src;
  if (typeof src !== "string" || !src.startsWith("/") || !extensionOptimisable(src)) return { ...proprietes };
  const dims = dimensionsDe(src);
  const variantes = LARGEURS_OPTIMISEES
    .filter((l) => existsSync(path.join("public", cheminOptimise(src, l, "webp"))))
    .map((l) => `${cheminOptimise(src, l, "webp")} ${l}w`);
  // Le fichier d'origine reste proposé pour les grands affichages (écrans Retina), au-delà de la plus grande variante.
  if (variantes.length && dims && dims.width > Math.max(...LARGEURS_OPTIMISEES)) variantes.push(`${src} ${dims.width}w`);
  return {
    ...proprietes,
    loading: "lazy",
    decoding: "async",
    ...(dims && { width: dims.width, height: dims.height }),
    ...(variantes.length && { srcSet: variantes.join(", "), sizes: tailles }),
  };
}

const estVide = (n) => n.type === "text" && !String(n.value ?? "").trim();
const imageDe = (n) => {
  if (!n || n.type !== "element" || n.tagName !== "p") return null;
  const enfants = (n.children ?? []).filter((c) => !estVide(c));
  return enfants.length === 1 && enfants[0].type === "element" && enfants[0].tagName === "img" ? enfants[0] : null;
};
const enPortrait = (img) => {
  const d = dimensionsDe(img.properties?.src);
  return !!d && d.height > d.width;
};

export default defineHastPlugin({
  name: "galerie-images",
  element: {
    filter: ["p"],
    visit(noeud, ctx) {
    const seule = imageDe(noeud);
    if (!seule) return;
    const parent = ctx.parent(noeud);
    const freres = parent?.children ?? [];
    const position = ctx.indexOf(noeud);
    if (position === undefined) return;

    // On n'agit que sur le PREMIER paragraphe d'une suite d'images (les précédents, hors retours à la ligne, ne sont pas des images).
    let k = position - 1;
    while (k >= 0 && estVide(freres[k])) k--;
    if (k >= 0 && imageDe(freres[k])) return;

    // Suite de paragraphes « image seule », en tolérant les retours à la ligne entre eux.
    const suite = [noeud];
    let j = position + 1;
    while (j < freres.length && (imageDe(freres[j]) || estVide(freres[j]))) {
      if (imageDe(freres[j])) suite.push(freres[j]);
      j++;
    }

    // Image isolée (ou deux images) : on la laisse à sa place, simplement allégée.
    if (suite.length < SEUIL) {
      suite.forEach((p) => {
        const img = imageDe(p);
        ctx.replaceNode(p, { type: "element", tagName: "p", properties: {}, children: [{ type: "element", tagName: "img", properties: optimiser(img.properties, TAILLES_SEULE), children: [] }] });
      });
      return;
    }

    const sources = suite.map((p) => imageDe(p));
    const portraits = sources.filter(enPortrait).length;
    const classe = portraits * 2 > sources.length ? "galerie-photos" : "galerie-169";
    const images = sources.map((img) => ({ type: "element", tagName: "img", properties: optimiser(img.properties, TAILLES_GALERIE), children: [] }));
    suite.slice(1).forEach((p) => ctx.removeNode(p));
    ctx.replaceNode(noeud, { type: "element", tagName: "div", properties: { className: [classe] }, children: images });
    },
  },
});
