// Internationalisation du site : français (langue par défaut, à la racine) et anglais (sous /en/).
//
// - Les adresses françaises existantes ne changent pas ; l'anglais vit sous /en/ avec les MÊMES slugs.
// - Les clés internes des données (types de film, univers, critères…) restent en français dans le CMS :
//   seul l'affichage est traduit (voir les tables plus bas).
import { ui } from "./ui";

export type Lang = "fr" | "en";
export const LANGUES: Lang[] = ["fr", "en"];
export const LANGUE_PAR_DEFAUT: Lang = "fr";

/** Langue de la page courante, d'après le paramètre de route `[...lang]` (absent = français). */
export function langDe(params: { lang?: string }): Lang {
  return params.lang === "en" ? "en" : "fr";
}

/** `getStaticPaths` des pages statiques : une version par langue (le français sans préfixe). */
export function cheminsLangues() {
  return LANGUES.map((l) => ({ params: { lang: l === LANGUE_PAR_DEFAUT ? undefined : l } }));
}

/** Adresse interne dans une langue : url("en", "/creations") → "/en/creations" ; url("fr", "/") → "/". */
export function url(lang: Lang, chemin: string): string {
  const propre = chemin.startsWith("/") ? chemin : `/${chemin}`;
  if (lang === LANGUE_PAR_DEFAUT) return propre;
  return propre === "/" ? "/en/" : `/en${propre}`;
}

/** Retire le préfixe de langue d'un chemin : "/en/creations" → "/creations". */
export function sansLangue(chemin: string): string {
  const retire = chemin.replace(/^\/en(\/|$)/, "/");
  return retire === "" ? "/" : retire;
}

export function autreLangue(lang: Lang): Lang {
  return lang === "fr" ? "en" : "fr";
}

/** Texte d'interface : t("en", "menu.carnet"). Repli sur le français si une clé manque en anglais. */
export function t(lang: Lang, cle: string): string {
  return ui[lang]?.[cle] ?? ui.fr[cle] ?? cle;
}

/** Locale pour Intl / toLocaleDateString. */
export const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-GB" };

export function dateFormatee(lang: Lang, date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString(LOCALES[lang], options);
}

// ---- Libellés des valeurs du CMS (les clés restent en français dans les fiches) ----

const TYPES_FILM: Record<string, string> = {
  "Making-of": "Making-of",
  Documentaire: "Documentary",
  "Activation / Aftermovie": "Activation / Aftermovie",
  Institutionnel: "Corporate",
  "Brand Content": "Brand content",
  RSE: "CSR",
  Fiction: "Fiction",
  Clip: "Music video",
  Expérimental: "Experimental",
};

const ROLES: Record<string, string> = {
  réalisateur: "Director",
  réalisatrice: "Director",
  producteur: "Producer",
  monteur: "Editor",
  photographe: "Photographer",
  cadreur: "Camera operator",
  "chef opérateur": "Director of photography",
  scénariste: "Writer",
  "directeur artistique": "Art director",
};

const UNIVERS: Record<string, string> = {
  Mode: "Fashion",
  Musique: "Music",
  "Série/Cinéma": "Series / Film",
  Art: "Art",
  Culture: "Culture",
  "Terroir / Gastronomie": "Terroir / Gastronomy",
  Éducation: "Education",
  Sciences: "Science",
  Société: "Society",
  Sport: "Sport",
  Solidarité: "Solidarity",
  Environnement: "Environment",
};

const CRITERES: Record<string, string> = {
  Interviews: "Interviews",
  "Mise en scène / Direction artistique": "Staging / Art direction",
  "Tournage à l'étranger": "Shooting abroad",
  "Projet au long cours": "Long-term project",
  "Images d'archives": "Archive footage",
};

const TABLES: Record<string, Record<string, string>> = {
  type: TYPES_FILM,
  genre: TYPES_FILM,
  univers: UNIVERS,
  critere: CRITERES,
};

/** Libellé affiché d'une valeur du CMS : libelle("en", "univers", "Mode") → "Fashion". */
export function libelle(lang: Lang, categorie: "type" | "genre" | "univers" | "critere", valeur: string): string {
  if (lang === "fr") return valeur;
  return TABLES[categorie]?.[valeur] ?? valeur;
}

/** Libellés des filtres Univers et Critères dans la langue donnée : valeur du CMS → libellé affiché. */
export function libellesRecherche(lang: Lang): Record<string, string> {
  const sortie: Record<string, string> = {};
  for (const categorie of ["univers", "critere"] as const) {
    for (const valeur of Object.keys(TABLES[categorie] ?? {})) sortie[valeur] = libelle(lang, categorie, valeur);
  }
  return sortie;
}

/** « Réalisateur / Monteur » → « Director / Editor » (les mots inconnus restent tels quels). */
export function roleAffiche(lang: Lang, role: string | undefined): string | undefined {
  if (!role || lang === "fr") return role;
  return role
    .split("/")
    .map((part) => {
      const mot = part.trim();
      const trad = ROLES[mot.toLowerCase()];
      return trad ?? mot;
    })
    .join(" / ");
}

/** Genre / rôle des Créations (Réalisateur, Producteur). */
export function roleCreation(lang: Lang, role: string): string {
  return lang === "fr" ? role : ROLES[role.toLowerCase()] ?? role;
}
