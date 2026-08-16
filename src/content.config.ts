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
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      categorie: z.enum(["commandes", "creations"]),
      client: z.string().optional(),
      date: z.coerce.date().optional(),
      couverture: image().or(z.string()).optional(),
      ordre: z.number().optional(),
      lieu: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      description: z.string().optional(),
      image1: image().or(z.string()).optional(),
      image2: image().or(z.string()).optional(),
      image3: image().or(z.string()).optional(),
    }),
});

const carnet = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/carnet" }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      date: z.coerce.date(),
      extrait: z.string().optional(),
      couverture: image().or(z.string()).optional(),
      brouillon: z.boolean().optional().default(false),
    }),
});

export const collections = { projets, carnet };
