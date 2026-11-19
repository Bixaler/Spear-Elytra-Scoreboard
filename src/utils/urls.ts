/** Absolute URLs for the two app routes (works in dev and on GitHub Pages). */
export function routeUrl(route: 'overlay' | 'control'): string {
  return `${location.origin}${location.pathname}#/${route}`;
}
