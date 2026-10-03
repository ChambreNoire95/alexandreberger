// Plugin Markdown (moteur Sätteri d'Astro 7) : une suite de 3 images (ou plus) collées dans un texte
// devient automatiquement une grille (<div class="galerie-169">, styles dans projets/[slug].astro).
//
// Pourquoi : l'éditeur de texte de Pages CMS réécrit le contenu en Markdown simple et supprime les blocs
// HTML saisis à la main (c'est arrivé à la fiche « 60 ans d'avenirs »). Ainsi la grille ne dépend plus
// d'un bloc HTML : il suffit d'enchaîner les images, une par paragraphe.
import { defineHastPlugin } from "satteri";

const SEUIL = 3;

const estVide = (n) => n.type === "text" && !String(n.value ?? "").trim();
const imageDe = (n) => {
  if (!n || n.type !== "element" || n.tagName !== "p") return null;
  const enfants = (n.children ?? []).filter((c) => !estVide(c));
  return enfants.length === 1 && enfants[0].type === "element" && enfants[0].tagName === "img" ? enfants[0] : null;
};

export default defineHastPlugin({
  name: "galerie-images",
  element: {
    filter: ["p"],
    visit(noeud, ctx) {
    if (!imageDe(noeud)) return;
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
    if (suite.length < SEUIL) return;

    const images = suite.map((p) => ({ type: "element", tagName: "img", properties: { ...imageDe(p).properties }, children: [] }));
    suite.slice(1).forEach((p) => ctx.removeNode(p));
    ctx.replaceNode(noeud, { type: "element", tagName: "div", properties: { className: ["galerie-169"] }, children: images });
    },
  },
});
