import records from '@/data/providers.json';
import type { Provider } from './types';
export const providers = records as Provider[];
export interface Filters {
  location: string;
  service: string;
  insurance: string;
  affordability: string;
}

// Approximate city-center search anchors, NOT clinic coordinates.
const anchors: Record<string, [number, number]> = {
  'fort lauderdale': [-80.1373, 26.1224],
  'ft lauderdale': [-80.1373, 26.1224],
  lauderhill: [-80.2134, 26.1404],
  hollywood: [-80.1495, 26.0112],
  'pompano beach': [-80.1248, 26.2379],
  'lauderdale lakes': [-80.2014, 26.1665],
  miami: [-80.1918, 25.7617],
  'miami beach': [-80.1300, 25.7907],
  'north miami': [-80.1867, 25.8901],
  'south miami': [-80.2934, 25.7076],
  'florida city': [-80.4776, 25.4479],
};

function milesBetween(a: [number, number], b: [number, number]) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function normalized(value: string) {
  return value.toLowerCase().trim().replace(/,?\s*(fl|florida|usa)$/i, '').trim();
}
function matchNonLocation(p: Provider, f: Filters) {
  return (
    (!f.service || p.services.includes(f.service as Provider['services'][number])) &&
    (!f.insurance || p.insurance.some((i) => i.toLowerCase().includes(f.insurance.toLowerCase().trim()))) &&
    (!f.affordability || p.affordability === f.affordability)
  );
}
export interface CareSearchResult {
  exact: Provider[];
  nearby: Provider[];
  // Unknown insurance must not be presented as confirmed acceptance.
  insuranceUnknown: Provider[];
  anchorFound: boolean;
}
export function searchCareProviders(data: Provider[], filters: Filters, nearbyMiles = 35): CareSearchResult {
  const location = normalized(filters.location);
  const anchor = anchors[location];
  const eligible = data.filter((p) => matchNonLocation(p, filters));
  const sortByDistance = (a: Provider, b: Provider) =>
    anchor ? milesBetween(anchor, a.coordinates) - milesBetween(anchor, b.coordinates) : a.name.localeCompare(b.name);
  if (!location) return { exact: [...eligible].sort(sortByDistance), nearby: [], insuranceUnknown: [], anchorFound: false };
  const exact = eligible.filter((p) => {
    const searchable = `${p.name} ${p.city} ${p.county} ${p.address}`.toLowerCase();
    return searchable.includes(location);
  }).sort(sortByDistance);
  const ids = new Set(exact.map((p) => p.id));
  // Nearby clinics must still match the requested service and documented insurance.
  const nearby = anchor
    ? eligible.filter((p) => !ids.has(p.id) && milesBetween(anchor, p.coordinates) <= nearbyMiles).sort(sortByDistance)
    : [];
  return { exact, nearby, insuranceUnknown: [], anchorFound: Boolean(anchor) };
}
export function filterProviders(data: Provider[], filters: Filters) {
  const results = searchCareProviders(data, filters);
  return [...results.exact, ...results.nearby];
}
