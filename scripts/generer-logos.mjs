// Logos des références (pied de page) : convertit chaque logo source en PNG blanc sur fond transparent.
//
//   node scripts/generer-logos.mjs
//
// - Sources : scripts/logos/sources/ (SVG, PNG, JPG, WebP), listées dans scripts/logos/clients.json.
// - Sorties : public/logos/<nom>.png (blanc + transparence, rognés) et src/data/logos-clients.json
//   (nom, chemin, dimensions d'affichage), lu par Layout.astro.
// - Lancé à la main (pas au build) : les PNG générés sont commités. À relancer après tout ajout de logo.
// - Une référence sans "fichier" dans clients.json reste affichée en texte, à la fin de la liste.
// - "url" : site officiel de la référence ; le logo y renvoie (nouvel onglet).
// - "echelle": 1.15 dans clients.json agrandit de 15 % un logo peu lisible à la taille normale.
// - L'ordre de clients.json est l'ordre d'affichage : par notoriété décroissante (preuve pour le démarchage).
//
// "mode" (comment on décide de ce qui devient blanc) :
//   alpha  : tout ce qui est opaque devient blanc (logo d'une seule teinte sur fond transparent).
//   sombre : plus un pixel est foncé, plus il est blanc ; le blanc d'origine devient transparent
//            (logo multicolore ou sur fond blanc : on garde les nuances au lieu d'un aplat).
//   clair  : l'inverse, plus un pixel est clair, plus il est blanc (logo clair sur fond foncé).
//   fond   : tout ce qui diffère de la couleur du coin haut-gauche devient blanc (aplat de couleur opaque).
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = path.join(RACINE, "scripts/logos/sources");
const SORTIE = path.join(RACINE, "public/logos");
const DONNEES = path.join(RACINE, "src/data/logos-clients.json");

const HAUTEUR_TRAVAIL = 480; // rendu intermédiaire, avant rognage
const BOITE = { largeur: 420, hauteur: 180 }; // taille maximale du PNG final (≈ 3× l'affichage)
// Affichage : surface visuelle constante (un logo carré n'est pas minuscule à côté d'un logo très allongé).
const SURFACE = 2900; // px² à l'écran
const AFFICHAGE_MAX = { largeur: 132, hauteur: 46 };

const borne = (v) => Math.max(0, Math.min(1, v));
const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function encre(mode, r, g, b, a, fond) {
  const alpha = a / 255;
  if (mode === "alpha") return alpha;
  if (mode === "sombre") return alpha * borne((1 - luminance(r, g, b)) * 1.7);
  if (mode === "clair") return alpha * borne((luminance(r, g, b) - 0.25) * 1.6);
  if (mode === "fond") {
    const ecart = Math.hypot(r - fond[0], g - fond[1], b - fond[2]) / 255;
    return alpha * borne(ecart * 1.6);
  }
  throw new Error(`Mode inconnu : ${mode}`);
}

const slug = (fichier) => path.basename(fichier, path.extname(fichier));

const clients = JSON.parse(await readFile(path.join(RACINE, "scripts/logos/clients.json"), "utf8"));
await mkdir(SORTIE, { recursive: true });
const donnees = [];

for (const client of clients) {
  if (!client.fichier) {
    donnees.push({ nom: client.nom, url: client.url });
    continue;
  }
  const { data, info } = await sharp(path.join(SOURCES, client.fichier), { density: 400 })
    .resize({ height: HAUTEUR_TRAVAIL, withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const fond = [data[0], data[1], data[2]];
  const blanc = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    blanc[i] = blanc[i + 1] = blanc[i + 2] = 255;
    blanc[i + 3] = Math.round(encre(client.mode, data[i], data[i + 1], data[i + 2], data[i + 3], fond) * 255);
  }
  const fichierSortie = `${slug(client.fichier)}.png`;
  const final = await sharp(blanc, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 12 })
    .resize({ width: BOITE.largeur, height: BOITE.hauteur, fit: "inside" })
    .png({ compressionLevel: 9, palette: true, colours: 64 })
    .toFile(path.join(SORTIE, fichierSortie));

  const ratio = final.width / final.height;
  let hauteur = Math.sqrt(SURFACE / ratio);
  let largeur = hauteur * ratio;
  // "echelle" (facultatif, ex. 1.15) : agrandit un logo peu lisible à taille normale (détails fins, petit texte).
  const echelle = Math.min(1, AFFICHAGE_MAX.largeur / largeur, AFFICHAGE_MAX.hauteur / hauteur) * (client.echelle ?? 1);
  donnees.push({ nom: client.nom, url: client.url, logo: `/logos/${fichierSortie}`, largeur: Math.round(largeur * echelle), hauteur: Math.round(hauteur * echelle) });
  console.log(`${client.nom.padEnd(34)} ${client.mode.padEnd(7)} ${final.width}×${final.height}  ${(final.size / 1024).toFixed(1)} Ko`);
}

await mkdir(path.dirname(DONNEES), { recursive: true });
await writeFile(DONNEES, JSON.stringify(donnees, null, 2) + "\n");
console.log(`\n${donnees.filter((d) => d.logo).length} logos, ${donnees.filter((d) => !d.logo).length} références en texte → ${path.relative(RACINE, DONNEES)}`);
