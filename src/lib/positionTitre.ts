// Position de référence des pages Films de commande / Créations : le titre
// « Films de commande | Créations » près du haut de l'écran, filtres juste en
// dessous. Utilisée après un clic sur un filtre.
const DECALAGE_HAUT_PX = 28;

export function scrollerVersTitre(): void {
  const titre = document.querySelector<HTMLElement>(".titre-switch");
  if (!titre) return;

  const cible = Math.max(0, titre.getBoundingClientRect().top + window.scrollY - DECALAGE_HAUT_PX);
  window.scrollTo({ top: cible, left: 0, behavior: "instant" });
}

// Après un clic sur « Films de commande » / « Créations » (switch de titre) : la page s'affiche au-dessus du
// carrousel, avec une marge de 100 px au-dessus de lui (à défaut de carrousel, on retombe sur le titre).
const MARGE_CARROUSEL_PX = 100;

export function scrollerVersCarrousel(): void {
  const carrousel = document.querySelector<HTMLElement>(".carrousel-wrap");
  if (!carrousel) return scrollerVersTitre();

  const cible = Math.max(0, carrousel.getBoundingClientRect().top + window.scrollY - MARGE_CARROUSEL_PX);
  window.scrollTo({ top: cible, left: 0, behavior: "instant" });
}
