// Génère, pour chaque image de public/uploads, des variantes WebP/AVIF
// redimensionnées (public/uploads/_optimise/) consommées par
// src/components/OptimizedImage.astro. Tourne avant chaque build/dev (voir
// package.json), retraite uniquement les fichiers nouveaux ou modifiés.
import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { LARGEURS_OPTIMISEES, DOSSIER_OPTIMISE, EXTENSIONS_OPTIMISABLES } from "../src/lib/image-config.mjs";

const DOSSIER_SOURCE = path.resolve("public/uploads");
const DOSSIER_SORTIE = path.join(DOSSIER_SOURCE, DOSSIER_OPTIMISE);

async function main() {
  if (!existsSync(DOSSIER_SOURCE)) return;
  await mkdir(DOSSIER_SORTIE, { recursive: true });

  const entrees = await readdir(DOSSIER_SOURCE, { withFileTypes: true });
  const fichiers = entrees.filter(
    (f) => f.isFile() && EXTENSIONS_OPTIMISABLES.has(path.extname(f.name).toLowerCase())
  );

  let generes = 0;
  /** Dimensions réelles des sources, pour que <OptimizedImage> puisse poser
      width/height sur chaque <img> (évite le décalage de mise en page, CLS). */
  const manifest = {};

  for (const fichier of fichiers) {
    const cheminSource = path.join(DOSSIER_SOURCE, fichier.name);
    const nom = path.parse(fichier.name).name;
    const { mtimeMs } = await stat(cheminSource);
    const { width, height } = await sharp(cheminSource).metadata();

    if (width && height) manifest[fichier.name] = { width, height };

    for (const largeur of LARGEURS_OPTIMISEES) {
      if (width && largeur > width) continue;

      for (const format of /** @type {const} */ (["webp", "avif"])) {
        const cheminSortie = path.join(DOSSIER_SORTIE, `${nom}-${largeur}w.${format}`);
        if (existsSync(cheminSortie) && (await stat(cheminSortie)).mtimeMs >= mtimeMs) continue;

        const image = sharp(cheminSource).resize({ width: largeur, withoutEnlargement: true });
        if (format === "webp") await image.webp({ quality: 80 }).toFile(cheminSortie);
        else await image.avif({ quality: 60 }).toFile(cheminSortie);
        generes++;
      }
    }
  }

  await writeFile(path.join(DOSSIER_SORTIE, "manifest.json"), JSON.stringify(manifest));

  console.log(`[optimize-images] ${generes} fichier(s) généré(s) (${fichiers.length} image(s) source scannée(s)).`);
}

main().catch((err) => {
  console.error("[optimize-images] échec :", err);
  process.exit(1);
});
