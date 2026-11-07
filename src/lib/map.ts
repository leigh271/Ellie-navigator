import type { Provider } from './types';
import type { Map as LibreMap, StyleSpecification } from 'maplibre-gl';
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
export const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};
export const REGION_CENTER: [number, number] = [-80.3, 25.94];
export function directionsURL(provider: Pick<Provider, 'coordinates'>) {
  const [lng, lat] = provider.coordinates;
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: `${lat},${lng}` })}`;
}
export function appleDirectionsURL(provider: Pick<Provider, 'coordinates'>) {
  const [lng, lat] = provider.coordinates;
  return 'https://maps.apple.com/?' + new URLSearchParams({ daddr: `${lat},${lng}`, dirflg: 'd' });
}
export function fitProviderBounds(
  map: LibreMap,
  providers: Provider[],
  animate = true,
  emptyCenter?: [number, number],
) {
  if (!map.getContainer().clientWidth || !map.getContainer().clientHeight) return false;
  const duration =
    animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 450 : 0;
  if (!providers.length) {
    map.easeTo({ center: emptyCenter ?? REGION_CENTER, zoom: emptyCenter ? 10 : 8.6, duration });
    return true;
  }
  const lngs = providers.map((p) => p.coordinates[0]);
  const lats = providers.map((p) => p.coordinates[1]);
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    {
      padding: { top: 90, bottom: 105, left: 45, right: 45 },
      maxZoom: 12,
      duration,
    },
  );
  return true;
}
