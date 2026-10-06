// Plugin Markdown (moteur Sätteri d'Astro 7) : espaces insécables de la ponctuation française dans le corps
// des fiches et du carnet (voir src/lib/typo-fr.mjs). Seuls les textes français sont concernés : les
// dossiers « -en » (traductions) sont laissés tels quels.
import { defineHastPlugin } from "satteri";
import { typoFr } from "./typo-fr.mjs";

const estFrancais = (ctx) => /\/content\/(projets|carnet)\//.test(ctx.fileURL?.pathname ?? "");
const SANS_CORRECTION = new Set(["code", "pre", "script", "style"]);

export default defineHastPlugin({
  name: "typo-fr",
  text(noeud, ctx) {
    if (!estFrancais(ctx)) return;
    const parent = ctx.parent(noeud);
    if (parent?.type === "element" && SANS_CORRECTION.has(parent.tagName)) return;
    const corrige = typoFr(noeud.value);
    if (corrige !== noeud.value) return { type: "text", value: corrige };
  },
  element: {
    filter: ["img"],
    visit(noeud, ctx) {
      if (!estFrancais(ctx)) return;
      const alt = noeud.properties?.alt;
      if (typeof alt === "string" && typoFr(alt) !== alt) ctx.setProperty(noeud, "alt", typoFr(alt));
    },
  },
});
