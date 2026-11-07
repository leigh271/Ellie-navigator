import { kinds, services, type Provider } from './types';
const allowedServices = new Set<string>([
  ...services,
  'Pap / HPV screening',
  'Annual gynecology',
  'PCOS',
  'Fibroids',
  'Birth control',
]);
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
export function isPublishedProvider(value: unknown): value is Provider {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (
    !['id', 'name', 'address', 'city'].every(
      (k) => typeof p[k] === 'string' && String(p[k]).trim(),
    ) ||
    !Object.keys(kinds).includes(String(p.kind)) ||
    !['Broward', 'Miami-Dade'].includes(String(p.county)) ||
    !['location', 'reviewed'].includes(String(p.verification))
  )
    return false;
  if (
    !Array.isArray(p.coordinates) ||
    p.coordinates.length !== 2 ||
    !p.coordinates.every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    !(
      p.coordinates[0] > -81 &&
      p.coordinates[0] < -79.8 &&
      p.coordinates[1] > 25.1 &&
      p.coordinates[1] < 26.5
    )
  )
    return false;
  if (
    !strings(p.services) ||
    !p.services.every((v) => allowedServices.has(v)) ||
    !strings(p.insurance) ||
    !['unknown', 'sliding-scale'].includes(String(p.affordability))
  )
    return false;
  if (
    ['phone', 'organization', 'state', 'zip'].some(
      (k) => p[k] !== undefined && typeof p[k] !== 'string',
    )
  )
    return false;
  if (p.insuranceDeclined !== undefined && !strings(p.insuranceDeclined)) return false;
  if (p.website !== null) {
    if (typeof p.website !== 'string') return false;
    try {
      if (!['http:', 'https:'].includes(new URL(p.website).protocol)) return false;
    } catch {
      return false;
    }
  }
  if (!Array.isArray(p.sources) || !p.sources.length) return false;
  const fields = new Set<string>();
  for (const source of p.sources) {
    if (
      !source ||
      typeof source !== 'object' ||
      typeof source.url !== 'string' ||
      typeof source.title !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt) ||
      !strings(source.fields)
    )
      return false;
    try {
      if (new URL(source.url).protocol !== 'https:') return false;
    } catch {
      return false;
    }
    source.fields.forEach((f: string) => fields.add(f));
  }
  if (
    !fields.has('address') ||
    !fields.has('coordinates') ||
    !p.services.every((s) => fields.has(s)) ||
    !p.insurance.every((plan) => fields.has('insurance') || fields.has(`insurance:${plan}`))
  )
    return false;
  if (p.affordability === 'sliding-scale' && !fields.has('affordability')) return false;
  if (p.bookingUrl && !fields.has('bookingUrl')) return false;
  return true;
}
export function parseProviderDataset(value: unknown): Provider[] {
  if (!Array.isArray(value) || !value.every(isPublishedProvider))
    throw new Error(
      'Provider dataset failed its publication contract. Review source evidence and coordinates.',
    );
  if (new Set(value.map((p) => p.id)).size !== value.length)
    throw new Error('Duplicate provider IDs');
  return value;
}
