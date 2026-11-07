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
  if (p.selfPay !== undefined && typeof p.selfPay !== 'boolean') return false;
  if (p.schedulingPhone !== undefined && typeof p.schedulingPhone !== 'string') return false;
  if (p.insuranceParticipation !== undefined) {
    if (
      !Array.isArray(p.insuranceParticipation) ||
      !p.insuranceParticipation.every(
        (e: Record<string, unknown>) =>
          e &&
          typeof e.carrier === 'string' &&
          !!e.carrier.trim() &&
          (e.plan === undefined || typeof e.plan === 'string') &&
          ['organization', 'location', 'provider-network'].includes(String(e.scope)) &&
          typeof e.sourceUrl === 'string' &&
          typeof e.checkedAt === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(e.checkedAt),
      )
    )
      return false;
  }
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
    if (
      source.origin === 'google-places' &&
      source.fields.some(
        (field: string) =>
          allowedServices.has(field) ||
          ['insurance', 'affordability', 'selfPay', 'bookingUrl', 'schedulingPhone'].includes(
            field,
          ) ||
          /^(insurance:|insuranceDeclined:|participation:)/.test(field),
      )
    )
      return false;
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
  if (p.selfPay !== undefined && !fields.has('selfPay')) return false;
  if (p.schedulingPhone !== undefined && !fields.has('schedulingPhone')) return false;
  if (
    p.insuranceParticipation !== undefined &&
    !(p.insuranceParticipation as Provider['insuranceParticipation'])!.every((entry) =>
      (p.sources as Provider['sources']).some(
        (source) =>
          source.url === entry.sourceUrl &&
          source.fields.includes(
            `participation:${entry.carrier}${entry.plan ? ':' + entry.plan : ''}`,
          ),
      ),
    )
  )
    return false;
  if (p.bookingUrl) {
    if (typeof p.bookingUrl !== 'string' || !fields.has('bookingUrl')) return false;
    try {
      if (new URL(p.bookingUrl).protocol !== 'https:') return false;
    } catch {
      return false;
    }
  }
  return true;
}
export function parseProviderDataset(value: unknown): Provider[] {
  if (!Array.isArray(value) || !value.every(isPublishedProvider))
    throw new Error(
      'Provider dataset failed its publication contract. Review source evidence and coordinates.',
    );
  const locationKeys = value.map((p) =>
    [p.name, p.address, p.city].map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')).join('|'),
  );
  if (new Set(locationKeys).size !== value.length) throw new Error('Duplicate clinic locations');
  if (new Set(value.map((p) => p.id)).size !== value.length)
    throw new Error('Duplicate provider IDs');
  return value;
}
