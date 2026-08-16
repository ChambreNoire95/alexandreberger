import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CACHE_PATH = fileURLToPath(new URL("../data/geocode-cache.json", import.meta.url));
const DELAI_MIN_MS = 1100; // Nominatim autorise au maximum 1 requête/seconde.

type Coordonnees = { lat: number; lng: number };

function lireCache(): Record<string, Coordonnees> {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

const cache = lireCache();
let dernierAppel = 0;

function ecrireCache() {
  try {
    writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
  } catch {
    // Système de fichiers en lecture seule (ex. build CI) : le cache reste valide pour cette exécution.
  }
}

/** Résout un nom de lieu en coordonnées via Nominatim (OpenStreetMap), avec cache disque. */
export async function geocoder(lieu: string): Promise<Coordonnees | null> {
  const cle = lieu.trim().toLowerCase();
  if (!cle) return null;
  if (cache[cle]) return cache[cle];

  const attente = DELAI_MIN_MS - (Date.now() - dernierAppel);
  if (attente > 0) await new Promise((r) => setTimeout(r, attente));
  dernierAppel = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(lieu)}`;
    const reponse = await fetch(url, { headers: { "User-Agent": "alexandreberger.com-geocoder" } });
    if (!reponse.ok) return null;

    const resultats = await reponse.json();
    if (!Array.isArray(resultats) || resultats.length === 0) return null;

    const coords: Coordonnees = { lat: parseFloat(resultats[0].lat), lng: parseFloat(resultats[0].lon) };
    if (Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) return null;

    cache[cle] = coords;
    ecrireCache();
    return coords;
  } catch {
    return null;
  }
}
