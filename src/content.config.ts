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
      genre: z.string().optional(),
      duree: z.string().optional(),
      couverture: z.string().optional(),
      lieu: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      description: z.string().optional(),
      video: z.string().optional(),
      image1: z.string().optional(),
      image2: z.string().optional(),
      image3: z.string().optional(),
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
      brouillon: z.boolean().optional().default(false),
    }),
});

export const collections = { projets, carnet };
