// services/directions.js
const ORIGIN = "München Rotkreuzplatz";
export function mapsRouteLink(dest) {
  return `https://www.google.com/maps/dir/${encodeURIComponent(ORIGIN)}/${encodeURIComponent(dest)}`;
}
