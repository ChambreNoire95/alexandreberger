import { typoFr } from "./typo-fr.mjs";

const MIN_CARACTERES = 60;

function nettoyer(markdown: string): string {
  return markdown
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrait une meta description (≈155 caractères max, coupée proprement) du
 * premier paragraphe d'un texte markdown. Renvoie undefined si le texte est
 * vide ou trop court pour être une vraie description.
 */
export function descriptionDepuisTexte(source: string | undefined, max = 155): string | undefined {
  // nettoyer() ramène toute espace (insécables comprises) à une espace simple : on repose ensuite les insécables
  // de la ponctuation française (sans effet sur un texte anglais).
  return typoFr(extraire(source, max));
}

function extraire(source: string | undefined, max: number): string | undefined {
  if (!source) return undefined;

  const paragraphe = source
    .split(/\n\s*\n/)
    .map(nettoyer)
    .find((p) => p.length > 0);
  if (!paragraphe || paragraphe.length < MIN_CARACTERES) return undefined;
  if (paragraphe.length <= max) return paragraphe;

  const coupe = paragraphe.slice(0, max - 1);
  const finPhrase = Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf("! "), coupe.lastIndexOf("? "));
  if (finPhrase >= max * 0.6) return coupe.slice(0, finPhrase + 1);

  const dernierEspace = coupe.lastIndexOf(" ");
  return coupe.slice(0, dernierEspace > 0 ? dernierEspace : coupe.length).replace(/[,;:—-]\s*$/, "") + "…";
}
