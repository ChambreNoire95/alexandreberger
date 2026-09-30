import { getCollection } from "astro:content";
import { basename, extname } from "node:path";
import carrouselOrdre from "../content/settings/carrousel.json";

// Ordre géré depuis Pages CMS (fichier unique "Ordre du carrousel", champ liste
// glissable) plutôt que projet par projet : voir .pages.yml et CLAUDE.md.
// Un projet absent de cette liste (nouvellement coché "carrousel") passe après
// ceux qui y figurent, trié par son ancien champ ordreCarrousel en secours.
const positionDansOrdre = new Map(carrouselOrdre.ordre.map((slug, index) => [slug, index]));

// Un projet peut être identifié dans la liste par son nom de fichier
// d'origine (stable, ne change jamais) OU par son champ "slug" personnalisé
// (l'URL actuelle, voir content.config.ts) : les deux fonctionnent, pour ne
// pas obliger à deviner lequel des deux la liste attend.
function position(p: { id: string; filePath?: string; data: { ordreCarrousel?: number } }) {
  const nomFichier = p.filePath ? basename(p.filePath, extname(p.filePath)) : undefined;
  const parFichier = nomFichier ? positionDansOrdre.get(nomFichier) : undefined;
  const parSlug = positionDansOrdre.get(p.id);
  return parFichier ?? parSlug ?? 10000 + (p.data.ordreCarrousel ?? Infinity);
}

export async function getItemsCarrousel() {
  const projets = await getCollection(
    "projets",
    ({ data }) => !!data.carrousel && !!(data.carrouselImage || data.couverture)
  );

  projets.sort((a, b) => position(a) - position(b));

  return projets.map((p) => ({
    href: `/projets/${p.id}`,
    src: (p.data.carrouselImage || p.data.couverture) as string,
    alt: p.data.carrouselImageAlt || p.data.couvertureAlt || p.data.titre,
    titre: p.data.carrouselTitre || p.data.titre,
  }));
}
