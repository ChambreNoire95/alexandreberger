// Position de référence des pages Films de commande / Créations : le titre
// « Films de commande | Créations » près du haut de l'écran, filtres juste en
// dessous. Utilisée après un clic sur le switch de titre ou sur un filtre.
const DECALAGE_HAUT_PX = 28;

export function scrollerVersTitre(): void {
  const titre = document.querySelector<HTMLElement>(".titre-switch");
  if (!titre) return;

  const cible = Math.max(0, titre.getBoundingClientRect().top + window.scrollY - DECALAGE_HAUT_PX);
  window.scrollTo({ top: cible, left: 0, behavior: "instant" });
}
