// Génère, pour chaque image de public/uploads, des variantes WebP/AVIF
// redimensionnées (public/uploads/_optimise/) consommées par
// src/components/OptimizedImage.astro. Tourne avant chaque build/dev (voir
// package.json).
//
// Les dérivées sont commitées dans le dépôt (voir .gitignore) : chaque
// déploiement Vercel repart d'un clone neuf du repo, sans le cache local
// habituel. Sans ça, le script devrait tout regénérer à chaque déploiement
// (Pages CMS en déclenche un à quasi chaque modification), d'où des builds
// de plusieurs minutes. Le hash du contenu source (pas le mtime, qui n'a
// aucun sens après un clone frais) permet de ne retraiter que les images
// réellement nouvelles ou modifiées, même sur un checkout tout neuf.
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { LARGEURS_OPTIMISEES, DOSSIER_OPTIMISE, EXTENSIONS_OPTIMISABLES } from "../src/lib/image-config.mjs";

const DOSSIER_SOURCE = path.resolve("public/uploads");
const DOSSIER_SORTIE = path.join(DOSSIER_SOURCE, DOSSIER_OPTIMISE);
const CHEMIN_MANIFEST = path.join(DOSSIER_SORTIE, "manifest.json");

function hash(buffer) {
  return createHash("sha1").update(buffer).digest("hex");
}

async function chargerManifestExistant() {
  if (!existsSync(CHEMIN_MANIFEST)) return {};
  try {
    return JSON.parse(await readFile(CHEMIN_MANIFEST, "utf-8"));
  } catch {
    return {};
  }
}

/** Les variantes attendues pour une image de largeur donnée existent-elles déjà sur disque ? */
function variantesPresentes(nom, width) {
  return LARGEURS_OPTIMISEES.every((largeur) => {
    if (width && largeur > width) return true; // pas générée, normal (pas d'agrandissement)
    return ["webp", "avif"].every((format) =>
      existsSync(path.join(DOSSIER_SORTIE, `${nom}-${largeur}w.${format}`))
    );
  });
}

async function main() {
  if (!existsSync(DOSSIER_SOURCE)) return;
  await mkdir(DOSSIER_SORTIE, { recursive: true });

  const entrees = await readdir(DOSSIER_SOURCE, { withFileTypes: true });
  const fichiers = entrees.filter(
    (f) => f.isFile() && EXTENSIONS_OPTIMISABLES.has(path.extname(f.name).toLowerCase())
  );

  const manifestPrecedent = await chargerManifestExistant();
  const manifest = {};
  let generes = 0;
  let ignores = 0;

  for (const fichier of fichiers) {
    const cheminSource = path.join(DOSSIER_SOURCE, fichier.name);
    const nom = path.parse(fichier.name).name;
    const contenu = await readFile(cheminSource);
    const empreinte = hash(contenu);

    const precedent = manifestPrecedent[fichier.name];
    if (precedent?.hash === empreinte && variantesPresentes(nom, precedent.width)) {
      manifest[fichier.name] = precedent;
      ignores++;
      continue;
    }

    const { width, height } = await sharp(contenu).metadata();
    if (width && height) manifest[fichier.name] = { width, height, hash: empreinte };

    for (const largeur of LARGEURS_OPTIMISEES) {
      if (width && largeur > width) continue;

      for (const format of /** @type {const} */ (["webp", "avif"])) {
        const cheminSortie = path.join(DOSSIER_SORTIE, `${nom}-${largeur}w.${format}`);
        const image = sharp(contenu).resize({ width: largeur, withoutEnlargement: true });
        if (format === "webp") await image.webp({ quality: 80 }).toFile(cheminSortie);
        else await image.avif({ quality: 60 }).toFile(cheminSortie);
        generes++;
      }
    }
  }

  await writeFile(CHEMIN_MANIFEST, JSON.stringify(manifest));

  console.log(
    `[optimize-images] ${generes} fichier(s) généré(s), ${ignores} image(s) déjà à jour (${fichiers.length} source(s) scannée(s)).`
  );
}

main().catch((err) => {
  console.error("[optimize-images] échec :", err);
  process.exit(1);
});
