/**
 * Créneaux de rappel téléphonique (heure de Paris), partagés par /api/rappel et les pages
 * (liste déroulante des heures). Aucun secret ici : importable côté page comme côté serveur.
 */

/** Plage horaire proposée pour un rappel (doit rester identique aux min/max des champs « heure » des formulaires). */
export const HEURE_MIN = "08:00";
export const HEURE_MAX = "20:00";

/** Date du jour à Paris, au format AAAA-MM-JJ (le serveur Vercel tourne en UTC). */
export function aujourdhuiParis(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
}

/** Heures proposées pour un rappel, par pas de 15 minutes : ["08:00", "08:15", …, "20:00"]. */
export function heuresRappel(): string[] {
  const [h0, m0] = HEURE_MIN.split(":").map(Number);
  const [h1, m1] = HEURE_MAX.split(":").map(Number);
  const heures: string[] = [];
  for (let minutes = h0 * 60 + m0; minutes <= h1 * 60 + m1; minutes += 15) {
    heures.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  return heures;
}

/** Vrai si la date (AAAA-MM-JJ) est réelle et n'est pas passée, et l'heure (HH:MM) est dans la plage. */
export function creneauValide(date: string, heure: string): boolean {
  const dateValide = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
  const heureValide = /^([01]\d|2[0-3]):(00|15|30|45)$/.test(heure) && heure >= HEURE_MIN && heure <= HEURE_MAX;
  return dateValide && heureValide && date >= aujourdhuiParis();
}

/** « mardi 10 mars 2099 à 10h30 (heure de Paris) » / « Tuesday, 10 March 2099 at 10:30 (Paris time) ». */
export function creneauLisible(date: string, heure: string, langue: "fr" | "en"): string {
  const jour = new Intl.DateTimeFormat(langue === "en" ? "en-GB" : "fr-FR", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  return langue === "en" ? `${jour} at ${heure} (Paris time)` : `${jour} à ${heure.replace(":", "h")} (heure de Paris)`;
}

/** Numéro de téléphone : chiffres, espaces et + ( ) . - ; au moins 6 chiffres. */
export function telephoneValide(telephone: string): boolean {
  return /^[\d\s+().-]+$/.test(telephone) && telephone.replace(/\D/g, "").length >= 6;
}
