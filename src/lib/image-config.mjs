// Config partagée entre le script de génération (scripts/optimize-images.mjs)
// et le composant d'affichage (src/components/OptimizedImage.astro), pour ne
// jamais désynchroniser les tailles générées et les tailles attendues.

// Calibrées sur des sources uploadées en 960x1280 (pas de palier au-delà,
// volontairement, pour ne jamais générer de fichier plus lourd qu'utile).
// Le palier 640 comble l'écart pour les cartes ~265-300px affichées en
// Retina (2x) : sans lui le navigateur saute directement à 960, bien plus
// lourd que nécessaire.
export const LARGEURS_OPTIMISEES = [480, 640, 960];
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

/** Chemin du manifest (dimensions réelles des sources) pour le dossier d'une image donnée. */
export function cheminManifest(srcPublic) {
  const dernierSlash = srcPublic.lastIndexOf("/");
  const dossier = srcPublic.slice(0, dernierSlash);
  return `${dossier}/${DOSSIER_OPTIMISE}/manifest.json`;
}

export function nomFichier(srcPublic) {
  return srcPublic.slice(srcPublic.lastIndexOf("/") + 1);
}
