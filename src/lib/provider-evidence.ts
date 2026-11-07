import type { Provider, Service } from './types';
export function safeWebsite(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}
export function hasEvidence(p: Provider, field: string) {
  return p.sources.some((s) => s.origin !== 'google-places' && s.fields.includes(field));
}
export function verifiedServices(p: Provider) {
  return p.services.filter((s) => hasEvidence(p, s));
}
export function supportsService(p: Provider, query: string) {
  if (!query) return true;
  const aliases: Record<string, string> = {
    PCOS: 'PCOS care',
    Fibroids: 'Fibroid care',
    'Annual gynecology': 'Annual gynecology / wellness',
    'Birth control': 'Birth control / family planning',
  };
  const normalize = (s: string) => aliases[s] || s;
  const available = verifiedServices(p).map(normalize);
  const target = normalize(query);
  if (target === 'Cervical cancer screening')
    return available.some((s) =>
      ['Cervical cancer screening', 'Pap test', 'HPV testing', 'Pap / HPV screening'].includes(s),
    );
  return available.includes(target);
}
export function verifiedPlans(p: Provider) {
  return p.insurance.filter(
    (plan) => hasEvidence(p, `insurance:${plan}`) || hasEvidence(p, 'insurance'),
  );
}
export type InsuranceStatus = 'not-requested' | 'confirmed' | 'unknown' | 'declined';
export function insuranceStatus(p: Provider, query: string): InsuranceStatus {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return 'not-requested';
  const match = (plan: string) => plan.trim().toLocaleLowerCase() === q;
  if (verifiedPlans(p).some(match)) return 'confirmed';
  if (
    verifiedParticipation(p).some(
      (entry) =>
        entry.scope !== 'organization' &&
        (entry.plan ? match(`${entry.carrier} ${entry.plan}`) : match(entry.carrier)),
    )
  )
    return 'confirmed';
  if (
    p.insuranceDeclined?.some((plan) => match(plan) && hasEvidence(p, `insuranceDeclined:${plan}`))
  )
    return 'declined';
  return 'unknown';
}
export function verifiedBookingURL(p: Provider) {
  return hasEvidence(p, 'bookingUrl') ? safeWebsite(p.bookingUrl) : null;
}
export function phoneURL(phone?: string) {
  if (!phone) return null;
  const extension = /(?:\s*x|\s*ext\.?)\s*(\d+)$/i.exec(phone);
  const number = (extension ? phone.slice(0, extension.index) : phone).replace(/[^+\d]/g, '');
  const digits = number.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return null;
  return `tel:${digits.length === 10 ? '+1' + digits : number}${extension ? ';ext=' + extension[1] : ''}`;
}
export function sourceDate(p: Provider) {
  return (
    [...p.sources]
      .map((s) => s.checkedAt)
      .sort()
      .at(-1) || 'Unknown'
  );
}
export function serviceLabel(service: Service) {
  return service;
}

export const insuranceCarriers = [
  'Florida Blue',
  'Aetna',
  'Cigna',
  'UnitedHealthcare',
  'Humana',
  'Ambetter',
  'Molina',
  'Sunshine Health',
  'Simply Healthcare',
  'Medicare',
  'Medicaid',
];
export function verifiedParticipation(p: Provider) {
  return (p.insuranceParticipation || []).filter((entry) =>
    p.sources.some(
      (source) =>
        source.origin !== 'google-places' &&
        source.url === entry.sourceUrl &&
        source.fields.includes(
          `participation:${entry.carrier}${entry.plan ? ':' + entry.plan : ''}`,
        ),
    ),
  );
}
export function selfPayStatus(p: Provider) {
  return hasEvidence(p, 'selfPay') && typeof p.selfPay === 'boolean'
    ? p.selfPay
      ? 'confirmed'
      : 'declined'
    : 'unknown';
}
export function providerCategories(p: Provider) {
  const tags: string[] = [];
  if (p.kind === 'community') tags.push('Community Health Centers');
  const offered = verifiedServices(p);
  if (supportsService(p, 'Cervical cancer screening'))
    tags.push('Cervical Cancer Screening / Pap Smears');
  if (offered.includes('HPV testing')) tags.push('HPV Testing');
  if (
    offered.some((s) =>
      ['Gynecology / OB-GYN', 'Annual gynecology / wellness', 'Annual gynecology'].includes(s),
    )
  )
    tags.push('Gynecology / OB-GYN');
  if (offered.some((s) => ['Birth control / family planning', 'Birth control'].includes(s)))
    tags.push('Family Planning / Reproductive Health');
  if (offered.includes('STI / sexual health testing')) tags.push('STI / Sexual Health Testing');
  if (offered.includes('Breast health / mammography')) tags.push('Breast Health / Mammography');
  if (offered.includes('Primary care / women’s preventive health'))
    tags.push('Primary Care / Women’s Preventive Health');
  if (p.affordability === 'sliding-scale' && hasEvidence(p, 'affordability'))
    tags.push('Low-Cost / Sliding-Scale Clinics');
  if (
    offered.some((s) => ['Women’s health specialty care', 'PCOS care', 'Fibroid care'].includes(s))
  )
    tags.push('Women’s Health Specialty Care');
  return tags;
}
