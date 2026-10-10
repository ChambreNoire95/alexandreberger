// Règles des pièces jointes du formulaire de la page Contact, partagées entre le navigateur (Layout.astro)
// et la route /api/contact. 4 Mo au total : une fonction Vercel refuse les requêtes de plus de 4,5 Mo.
export const PJ_NOMBRE_MAX = 5;
export const PJ_TAILLE_MAX = 4 * 1024 * 1024;
export const PJ_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "heic",
  "doc", "docx", "odt", "rtf", "txt", "pages",
  "ppt", "pptx", "key", "xls", "xlsx", "csv",
];
export const PJ_ACCEPT = PJ_EXTENSIONS.map((e) => `.${e}`).join(",");

type Fichier = { name: string; size: number };

// Renvoie null si tout est bon, sinon la nature du problème (et le fichier en cause pour "type").
export function verifierPiecesJointes(fichiers: Fichier[]): null | { probleme: "nombre" | "taille" | "type"; nom?: string } {
  if (fichiers.length > PJ_NOMBRE_MAX) return { probleme: "nombre" };
  for (const f of fichiers) {
    const extension = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "";
    if (!PJ_EXTENSIONS.includes(extension)) return { probleme: "type", nom: f.name };
  }
  if (fichiers.reduce((total, f) => total + f.size, 0) > PJ_TAILLE_MAX) return { probleme: "taille" };
  return null;
}
