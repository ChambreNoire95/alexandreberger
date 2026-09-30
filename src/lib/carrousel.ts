import { getCollection } from "astro:content";
import carrouselOrdre from "../content/settings/carrousel.json";

// Ordre géré depuis Pages CMS (fichier unique "Ordre du carrousel", champ liste
// glissable) plutôt que projet par projet : voir .pages.yml et CLAUDE.md.
// Un projet absent de cette liste (nouvellement coché "carrousel") passe après
// ceux qui y figurent, trié par son ancien champ ordreCarrousel en secours.
const positionDansOrdre = new Map(carrouselOrdre.ordre.map((slug, index) => [slug, index]));

export async function getItemsCarrousel() {
  const projets = await getCollection(
    "projets",
    ({ data }) => !!data.carrousel && !!(data.carrouselImage || data.couverture)
  );

  projets.sort((a, b) => {
    const posA = positionDansOrdre.get(a.id) ?? 10000 + (a.data.ordreCarrousel ?? Infinity);
    const posB = positionDansOrdre.get(b.id) ?? 10000 + (b.data.ordreCarrousel ?? Infinity);
    return posA - posB;
  });

  return projets.map((p) => ({
    href: `/projets/${p.id}`,
    src: (p.data.carrouselImage || p.data.couverture) as string,
    alt: p.data.carrouselImageAlt || p.data.couvertureAlt || p.data.titre,
    titre: p.data.carrouselTitre || p.data.titre,
  }));
}
