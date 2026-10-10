/** Numéro de téléphone : chiffres, espaces et + ( ) . - ; au moins 6 chiffres. */
export function telephoneValide(telephone: string): boolean {
  return /^[\d\s+().-]+$/.test(telephone) && telephone.replace(/\D/g, "").length >= 6;
}
