/** New requests start from a service family: « Créer une demande » brings the catalogue, further down the home, into view. */
export function scrollToCatalogue(): void {
  document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
