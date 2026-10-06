// Typographie française du contenu saisi dans Pages CMS : l'espace qui précède « : ; ! ? » et celle qui suit
// « devient insécable (U+00A0), pour qu'un signe de ponctuation ne se retrouve jamais seul en début de ligne.
//
// Pourquoi au rendu : les fiches sont écrites dans le CMS avec des espaces normales, et toute nouvelle
// saisie en réintroduirait. Les fichiers de contenu ne sont donc pas modifiés ; la correction est appliquée
// aux champs texte (src/lib/contenu.ts) et au corps Markdown (src/lib/rehype-typo-fr.mjs).
// On ne fait que remplacer une espace déjà présente : jamais d'ajout (adresses web, heures « 12:30 » intacts).
const INSECABLE = " ";

export function typoFr(texte) {
  if (typeof texte !== "string" || !texte) return texte;
  return texte
    .replace(/(\S) ([;!?»])/g, `$1${INSECABLE}$2`)
    .replace(/(\S) :(?=\s|$)/g, `$1${INSECABLE}:`)
    .replace(/« (?=\S)/g, `«${INSECABLE}`);
}
