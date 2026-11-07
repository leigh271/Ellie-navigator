import records from '@/data/providers.json';
import areas from '@/data/search-areas.json';
import type { Provider } from './types';
import { parseProviderDataset } from './provider-schema';
import {
  insuranceStatus,
  supportsService,
  type InsuranceStatus,
  selfPayStatus,
  providerCategories,
} from './provider-evidence';
export const providers = parseProviderDataset(records);
export interface Filters {
  location: string;
  service: string;
  insurance: string;
  affordability: string;
  carrier?: string;
  county?: string;
  category?: string;
  payment?: string;
}
export function normalizeLocation(value: string) {
  const zip = /^\s*(\d{5})(?:-\d{4})?\s*$/.exec(value);
  if (zip) return zip[1];
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/(?:[,\s]+(?:florida|fl|usa))+$/, '')
    .replace(/\s+county$/, '')
    .replace(/^ft\.?\s+/, 'fort ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function milesBetween(a: [number, number], b: [number, number]) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const h =
    Math.sin(rad(b[1] - a[1]) / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(Math.min(1, h)), Math.sqrt(Math.max(0, 1 - h)));
}
function locationMatch(p: Provider, q: string) {
  if (!q) return true;
  if (/^\d{5}$/.test(q)) return p.zip?.slice(0, 5) === q;
  return [p.name, p.city, p.county, p.address].some((v) => normalizeLocation(v).includes(q));
}
export interface SearchHit {
  provider: Provider;
  nearby: boolean;
  distanceMiles?: number;
  insurance: InsuranceStatus;
}
export interface CareSearchResult {
  exact: Provider[];
  nearby: Provider[];
  insuranceUnknown: Provider[];
  items: SearchHit[];
  anchorFound: boolean;
  origin?: [number, number];
  originLabel?: string;
  radiusUsed: number;
  declinedCount: number;
  locationMatchCount: number;
}
export function searchCareProviders(
  data: Provider[],
  filters: Filters,
  radiusLimit = 50,
): CareSearchResult {
  const q = normalizeLocation(filters.location);
  const insuranceQuery = insuranceQueryFor(filters);
  const knownAreas = areas as Record<string, { coordinates: number[]; basis: string }>;
  const area = Object.entries(knownAreas).find(([name]) => normalizeLocation(name) === q)?.[1];
  const directLocations = q ? data.filter((p) => locationMatch(p, q)) : [];
  const nameMatch = q
    ? data.find((p) => normalizeLocation(p.name) === q) ||
      (directLocations.length === 1 ? directLocations[0] : undefined)
    : undefined;
  const origin: [number, number] | undefined = area
    ? [area.coordinates[0], area.coordinates[1]]
    : nameMatch?.coordinates;
  const eligible = data.filter(
    (p) =>
      (!filters.county || p.county === filters.county) &&
      (!filters.category || providerCategories(p).includes(filters.category)) &&
      (!filters.payment || selfPayStatus(p) !== 'declined') &&
      supportsService(p, filters.service) &&
      (!filters.affordability ||
        (p.affordability === filters.affordability &&
          p.sources.some((s) => s.fields.includes('affordability')))),
  );
  const declined = eligible.filter((p) => insuranceStatus(p, insuranceQuery) === 'declined');
  const acceptedOrUnknown = eligible.filter(
    (p) => insuranceStatus(p, insuranceQuery) !== 'declined',
  );
  const exact = acceptedOrUnknown.filter((p) => locationMatch(p, q));
  const exactIds = new Set(exact.map((p) => p.id));
  let radiusUsed = [10, 25, 50].find((n) => n >= Math.min(50, Math.max(10, radiusLimit))) ?? 50;
  let nearby: Provider[] = [];
  if (q && origin && exact.length < 3) {
    for (const radius of [10, 25, 50].filter((n) => n <= radiusUsed)) {
      nearby = acceptedOrUnknown.filter(
        (p) => !exactIds.has(p.id) && milesBetween(origin, p.coordinates) <= radius,
      );
      if (exact.length + nearby.length >= 3 || radius === radiusUsed) {
        radiusUsed = radius;
        break;
      }
    }
  }
  const items: SearchHit[] = [...exact, ...nearby].map((p) => ({
    provider: p,
    nearby: !exactIds.has(p.id),
    distanceMiles: origin ? milesBetween(origin, p.coordinates) : undefined,
    insurance: insuranceStatus(p, insuranceQuery),
  }));
  const rank = (s: InsuranceStatus) => (s === 'unknown' ? 1 : 0);
  items.sort(
    (a, b) =>
      Number(a.nearby) - Number(b.nearby) ||
      (origin ? (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0) : 0) ||
      rank(a.insurance) - rank(b.insurance) ||
      (filters.payment
        ? Number(selfPayStatus(a.provider) !== 'confirmed') -
          Number(selfPayStatus(b.provider) !== 'confirmed')
        : 0) ||
      b.provider.sources.filter((s) => s.origin !== 'uploaded-hrsa').length -
        a.provider.sources.filter((s) => s.origin !== 'uploaded-hrsa').length,
  );
  return {
    exact,
    nearby,
    insuranceUnknown: items.filter((i) => i.insurance === 'unknown').map((i) => i.provider),
    items,
    anchorFound: Boolean(origin),
    origin,
    originLabel: area
      ? 'Approximate origin from HRSA sites in your city/ZIP; straight-line distances, not your location.'
      : nameMatch
        ? 'Distance from the source-listed clinic matching your query, not your own position.'
        : undefined,
    radiusUsed,
    declinedCount: declined.filter(
      (p) => locationMatch(p, q) || (origin && milesBetween(origin, p.coordinates) <= radiusUsed),
    ).length,
    locationMatchCount: data.filter((p) => locationMatch(p, q)).length,
  };
}
export function filterProviders(data: Provider[], filters: Filters) {
  return searchCareProviders(data, filters).items.map((i) => i.provider);
}

export function insuranceQueryFor(filters: Filters) {
  const carrier = filters.carrier?.trim() || '';
  const plan = filters.insurance.trim();
  return !carrier || plan.toLowerCase().startsWith(carrier.toLowerCase())
    ? plan
    : [carrier, plan].filter(Boolean).join(' ');
}
