// Config partagée entre le script de génération (scripts/optimize-images.mjs)
// et le composant d'affichage (src/components/OptimizedImage.astro), pour ne
// jamais désynchroniser les tailles générées et les tailles attendues.

export const LARGEURS_OPTIMISEES = [480, 960, 1600];
export const DOSSIER_OPTIMISE = "_optimise";
export const EXTENSIONS_OPTIMISABLES = new Set([".jpg", ".jpeg", ".png"]);

/** Chemin public (ex. "/uploads/_optimise/photo-960w.webp") pour une image source, une largeur et un format donnés. */
export function cheminOptimise(srcPublic, largeur, format) {
  const dernierSlash = srcPublic.lastIndexOf("/");
  const dossier = srcPublic.slice(0, dernierSlash);
  const nomFichier = srcPublic.slice(dernierSlash + 1);
  const nom = nomFichier.replace(/\.[^.]+$/, "");
  return `${dossier}/${DOSSIER_OPTIMISE}/${nom}-${largeur}w.${format}`;
}

export function extensionOptimisable(srcPublic) {
  const correspondance = srcPublic.match(/\.[^.]+$/);
  return !!correspondance && EXTENSIONS_OPTIMISABLES.has(correspondance[0].toLowerCase());
}
