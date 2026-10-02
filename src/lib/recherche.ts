// Moteur de « Trouver une référence » (page d'accueil, films de commande).
// Pas d'IA : normalisation (accents, pluriels), synonymes de besoins, puis
// score pondéré par champ. Fichier volontairement sans dépendance, utilisable
// côté navigateur comme en test Node.

export interface Fiche {
  /** Mots-clés saisis dans le CMS (séparés par des virgules) */
  k: string;
  /** Type de film */
  ty: string;
  /** Titres (accroche de liste + titre du film) */
  ti: string;
  /** Client + rôle */
  cl: string;
  /** Phrase d'accroche */
  ac: string;
  /** Début du texte */
  co: string;
}

export interface Resultat {
  index: number;
  score: number;
  /** Mots-clés de la fiche qui ont déclenché la correspondance (texte d'origine) */
  tags: string[];
}

const POIDS = { k: 7, ty: 3, ti: 2, cl: 1.5, ac: 1, co: 0.4 } as const;
export const SEUIL = 2;

const MOTS_VIDES = new Set(
  (
    "a ai au aux avec ayant besoin c ca ce ces cet cette comme comment dans de des du donc e elle en et est " +
    "faire fais faut film films gerer j je l la le les leur lui ma mais me mes moi mon ne nos notre nous on ou par pas " +
    "plus pour pourrait pourriez quel quelle quels que qui realiser realisation s sa se ses si son sont sur ta te tes " +
    "toi ton tu un une vos votre vous voudrais voudrions voulez veux souhaite souhaiterais souhaitons aimerais aimerions " +
    "cherche cherchons chercher recherche projet projets video videos creer faire fait y il ils elles"
  ).split(" ")
);

// Groupes de termes proches : un terme du groupe cherché fait aussi remonter les autres (poids réduit).
const GROUPES: string[][] = [
  ["interview", "temoignage", "entretien", "parole", "paroles"],
  ["aftermovie", "evenement", "evenementiel", "lancement", "soiree", "recap", "conference", "salon", "annonce"],
  ["documentaire", "reportage", "immersion"],
  ["institutionnel", "corporate", "entreprise", "rse", "presentation", "employeur"],
  ["making", "coulisse", "backstage", "behind"],
  ["marque", "pub", "publicite", "spot", "campagne", "communication", "brand"],
  ["musique", "clip", "concert", "chanteur", "chanteuse"],
  ["sport", "football", "foot", "athlete", "sportif"],
  ["gaming", "esport", "jeu", "twitch"],
  ["influenceur", "influenceuse", "reseau", "instagram", "tiktok", "createur", "creator"],
  ["ong", "humanitaire", "association", "fondation", "solidarite"],
  ["formation", "ecole", "etudiant", "universite"],
  ["exposition", "art", "installation", "artiste", "musee", "galerie"],
  ["international", "etranger", "voyage", "afrique"],
  ["mode", "fashion", "textile"],
  ["serie", "episode"],
  ["cinema", "metrage", "fiction", "festival", "tournage"],
  ["patrimoine", "histoire"],
];

const VERS_GROUPE = new Map<string, number[]>();
GROUPES.forEach((g, i) => g.forEach((m) => VERS_GROUPE.set(m, [...(VERS_GROUPE.get(m) ?? []), i])));

export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’\-/]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function racine(mot: string): string {
  return mot.length > 3 ? mot.replace(/(s|x)$/, "") : mot;
}

function jetons(texte: string): string[] {
  return normaliser(texte)
    .replace(/after movie/g, "aftermovie")
    .replace(/e sport/g, "esport")
    .replace(/jeux? video/g, "gaming")
    .replace(/long metrage/g, "metrage")
    .split(" ")
    .filter((m) => m.length > 1 && !MOTS_VIDES.has(m))
    .map(racine);
}

/** 1 = identique, 0.8 = l'un commence par l'autre (pluriels, « interviewer »), 0 = rien. */
function correspondance(terme: string, mot: string): number {
  if (terme === mot) return 1;
  if (terme.length >= 5 && mot.length >= 5 && (mot.startsWith(terme) || terme.startsWith(mot))) return 0.8;
  return 0;
}

function meilleure(terme: string, champ: string[]): number {
  let m = 0;
  for (const mot of champ) {
    const c = correspondance(terme, mot);
    if (c > m) m = c;
    if (m === 1) break;
  }
  return m;
}

export function classer(requete: string, fiches: Fiche[]): Resultat[] {
  const originaux = [...new Set(jetons(requete))];
  if (!originaux.length) return [];

  // terme -> poids (1 pour ce que le visiteur a écrit, 0.6 pour les termes proches)
  const termes = new Map<string, number>();
  for (const t of originaux) termes.set(t, 1);
  for (const t of originaux) {
    for (const gi of VERS_GROUPE.get(t) ?? []) {
      for (const proche of GROUPES[gi]) {
        const r = racine(proche);
        if (!termes.has(r)) termes.set(r, 0.6);
      }
    }
  }

  const resultats: Resultat[] = [];
  fiches.forEach((f, index) => {
    // Mots-clés : un tableau par mot-clé. Les premiers listés comptent davantage,
    // ce qui permet de choisir quelle fiche « gagne » sur un sujet donné.
    const motsCles = f.k.split(",").map((t) => jetons(t));
    const champs = {
      ty: jetons(f.ty),
      ti: jetons(f.ti),
      cl: jetons(f.cl),
      ac: jetons(f.ac),
      co: jetons(f.co),
    };

    let score = 0;
    for (const [terme, poids] of termes) {
      let meilleurK = 0;
      motsCles.forEach((mots, rang) => {
        meilleurK = Math.max(meilleurK, meilleure(terme, mots) * Math.max(0.3, 1 - 0.12 * rang));
      });
      score += POIDS.k * poids * meilleurK;
      for (const cle of ["ty", "ti", "cl", "ac", "co"] as const) {
        score += POIDS[cle] * poids * meilleure(terme, champs[cle]);
      }
    }
    // Bonus de couverture : combien de mots du visiteur ont été retrouvés quelque part.
    for (const t of originaux) {
      if (motsCles.some((m) => meilleure(t, m) > 0) || (["ty", "ti", "cl", "ac", "co"] as const).some((c) => meilleure(t, champs[c]) > 0)) score += 1;
    }

    if (score <= 0) return;
    const tags = f.k
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && jetons(t).some((j) => [...termes].some(([terme, poids]) => poids >= 0.6 && correspondance(terme, j) >= 0.8)))
      .slice(0, 3);
    resultats.push({ index, score, tags });
  });

  return resultats.sort((a, b) => b.score - a.score || a.index - b.index);
}
