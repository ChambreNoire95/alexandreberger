// Accès au contenu dans la bonne langue.
//
// Les fiches vivent en français (collection « projets ») ; leur traduction anglaise est un petit fichier
// à part (collection « projetsEn ») qui ne porte que les textes : titre, accroche, texte… Ici on fusionne
// les deux : on renvoie la fiche française dont les champs texte sont remplacés par l'anglais quand il
// existe. Une traduction manquante ou un champ vide retombe sur le français : le site ne casse jamais.
import { getCollection, type CollectionEntry } from "astro:content";
import { basename, extname } from "node:path";
import type { Lang } from "../i18n";
import { typoFr } from "./typo-fr.mjs";

const CHAMPS_TEXTE = [
  "titre",
  "titreFilm",
  "accroche",
  "description",
  "carrouselTitre",
  "couvertureAlt",
  "carrouselImageAlt",
  "image1Alt",
  "image2Alt",
  "image3Alt",
] as const;

// Espaces insécables de la ponctuation française sur les champs texte (voir typo-fr.mjs). Appliqué à la
// fiche française avant la fusion : un champ non traduit garde ainsi sa typographie sur le site anglais.
function avecTypo<E extends { data: object }>(entree: E, champs: readonly string[]): E {
  const data = { ...entree.data } as Record<string, unknown>;
  for (const champ of champs) if (typeof data[champ] === "string") data[champ] = typoFr(data[champ]);
  return { ...entree, data };
}

const nomFichier = (entree: { filePath?: string; id: string }) =>
  entree.filePath ? basename(entree.filePath, extname(entree.filePath)) : entree.id;

export type Projet = CollectionEntry<"projets"> & {
  /** Entrée à passer à render() : la version anglaise si elle a un texte, sinon la française. */
  source: CollectionEntry<"projets"> | CollectionEntry<"projetsEn">;
  /** true si ce contenu est une traduction (et non le repli français). */
  traduit: boolean;
};

/** Projets (fiches) dans la langue demandée, filtrés comme avec getCollection. */
export async function getProjets(
  lang: Lang,
  filtre?: (entree: CollectionEntry<"projets">) => boolean
): Promise<Projet[]> {
  const fr = (await getCollection("projets", filtre)).map((p) => avecTypo(p, CHAMPS_TEXTE));
  if (lang === "fr") return fr.map((p) => ({ ...p, source: p, traduit: false }));

  const en = new Map((await getCollection("projetsEn")).map((e) => [e.id, e]));
  return fr.map((p) => {
    const trad = en.get(nomFichier(p));
    if (!trad) return { ...p, source: p, traduit: false };
    const data = { ...p.data } as Record<string, unknown>;
    for (const champ of CHAMPS_TEXTE) {
      const valeur = (trad.data as Record<string, unknown>)[champ];
      if (typeof valeur === "string" && valeur.trim()) data[champ] = valeur.trim();
    }
    const aUnTexte = !!trad.body?.trim();
    return {
      ...p,
      data: data as typeof p.data,
      body: aUnTexte ? trad.body : p.body,
      source: aUnTexte ? trad : p,
      traduit: true,
    };
  });
}

const CHAMPS_TEXTE_CARNET = ["titre", "extrait", "couvertureAlt"] as const;

export type EntreeCarnet = CollectionEntry<"carnet"> & {
  source: CollectionEntry<"carnet"> | CollectionEntry<"carnetEn">;
};

/** Entrées du carnet dans la langue demandée (mêmes règles de repli que les fiches). */
export async function getCarnet(
  lang: Lang,
  filtre?: (entree: CollectionEntry<"carnet">) => boolean
): Promise<EntreeCarnet[]> {
  const fr = (await getCollection("carnet", filtre)).map((e) => avecTypo(e, CHAMPS_TEXTE_CARNET));
  if (lang === "fr") return fr.map((e) => ({ ...e, source: e }));

  const en = new Map((await getCollection("carnetEn")).map((e) => [e.id, e]));
  return fr.map((e) => {
    const trad = en.get(nomFichier(e));
    if (!trad) return { ...e, source: e };
    const data = { ...e.data };
    for (const champ of CHAMPS_TEXTE_CARNET) {
      const valeur = trad.data[champ];
      if (typeof valeur === "string" && valeur.trim()) (data as Record<string, unknown>)[champ] = valeur.trim();
    }
    const aUnTexte = !!trad.body?.trim();
    return { ...e, data, body: aUnTexte ? trad.body : e.body, source: aUnTexte ? trad : e };
  });
}
