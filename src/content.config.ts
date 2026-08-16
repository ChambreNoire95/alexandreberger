import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projets = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projets" }),
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
