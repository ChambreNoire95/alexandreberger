import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { basename, extname } from "node:path";

const projets = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projets",
    // Par défaut, Astro préfixe l'id avec le sous-dossier (ex. "commandes/mon-projet"),
    // ce qui changerait l'URL publique du projet. Les dossiers Commandes/Créations créés
    // dans Pages CMS ne servent qu'à ranger les fichiers : on ignore le dossier et on ne
    // garde que le nom de fichier, pour ne jamais toucher aux slugs déjà indexés.
    generateId: ({ entry }) => basename(entry, extname(entry)),
  }),
  // Pas de helper image() ici : Pages CMS écrit des chemins publics (/uploads/...)
  // dans le frontmatter, et le pipeline d'assets d'Astro tente de les résoudre comme
  // des imports locaux même via un `.or(z.string())`, ce qui casse le build (voir
  // ImageNotFound). Un simple z.string() laisse le champ inerte pour Astro : les
  // images restent de vrais fichiers publics, affichés via <img>.
  schema: () =>
    z.object({
      titre: z.string(),
      categorie: z.enum(["commandes", "creations"]),
      client: z.string().optional(),
      role: z.string().optional(),
      type: z.string().optional(),
      date: z.coerce.date().optional(),
      annee: z.number().optional(),
      anneeFin: z.number().optional(),
      genre: z.string().optional(),
      duree: z.string().optional(),
      couverture: z.string().optional(),
      couvertureAlt: z.string().optional(),
      lieu: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      description: z.string().optional(),
      video: z.string().optional(),
      image1: z.string().optional(),
      image1Alt: z.string().optional(),
      image2: z.string().optional(),
      image2Alt: z.string().optional(),
      image3: z.string().optional(),
      image3Alt: z.string().optional(),
      carrousel: z.boolean().optional(),
      ordreCarrousel: z.number().optional(),
      carrouselTitre: z.string().optional(),
      carrouselImage: z.string().optional(),
      carrouselImageAlt: z.string().optional(),
    }),
});

const carnet = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/carnet" }),
  schema: () =>
    z.object({
      titre: z.string(),
      date: z.coerce.date(),
      extrait: z.string().optional(),
      couverture: z.string().optional(),
      couvertureAlt: z.string().optional(),
      brouillon: z.boolean().optional().default(false),
    }),
});

// Les blocs de la page sommaire "Projets Satellites" : chacun mène à sa
// propre page fille (même principe que le Carnet). Nouveau bloc = nouvelle
// entrée dans le CMS, sans toucher au code.
const projetsParalleles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projets-paralleles" }),
  schema: () =>
    z.object({
      titre: z.string(),
      accroche: z.string().optional(),
      couverture: z.string().optional(),
      couvertureAlt: z.string().optional(),
      ordre: z.number().optional(),
      lien: z.string().optional(),
    }),
});

export const collections = { projets, carnet, projetsParalleles };
