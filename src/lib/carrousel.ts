import { getCollection } from "astro:content";
import { basename, extname } from "node:path";
import carrouselOrdre from "../content/settings/carrousel.json";

// Ordre géré depuis Pages CMS (fichier unique "Ordre du carrousel", champ liste
// glissable) plutôt que projet par projet : voir .pages.yml et CLAUDE.md.
// Un projet absent de cette liste (nouvellement coché "carrousel") passe après
// ceux qui y figurent, trié par son ancien champ ordreCarrousel en secours.
const positionDansOrdre = new Map(carrouselOrdre.ordre.map((slug, index) => [slug, index]));

// La liste référence les projets par leur nom de fichier (stable), pas par
// p.id (qui devient le champ "slug" personnalisé quand il est rempli, voir
// content.config.ts) : ça évite de devoir mettre à jour cette liste chaque
// fois qu'on change l'URL d'un projet.
function clefStable(p: { id: string; filePath?: string }) {
  return p.filePath ? basename(p.filePath, extname(p.filePath)) : p.id;
}

export async function getItemsCarrousel() {
  const projets = await getCollection(
    "projets",
    ({ data }) => !!data.carrousel && !!(data.carrouselImage || data.couverture)
  );

  projets.sort((a, b) => {
    const posA = positionDansOrdre.get(clefStable(a)) ?? 10000 + (a.data.ordreCarrousel ?? Infinity);
    const posB = positionDansOrdre.get(clefStable(b)) ?? 10000 + (b.data.ordreCarrousel ?? Infinity);
    return posA - posB;
  });

  return projets.map((p) => ({
    href: `/projets/${p.id}`,
    src: (p.data.carrouselImage || p.data.couverture) as string,
    alt: p.data.carrouselImageAlt || p.data.couvertureAlt || p.data.titre,
    titre: p.data.carrouselTitre || p.data.titre,
  }));
}
