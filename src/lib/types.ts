export type ProviderKind = 'community' | 'private' | 'hospital' | 'preventive';
export type Service =
  | 'Pap / HPV screening'
  | 'HPV vaccination'
  | 'Annual gynecology'
  | 'PCOS'
  | 'Fibroids'
  | 'Birth control';
export interface Provider {
  id: string;
  name: string;
  kind: ProviderKind;
  county: 'Broward' | 'Miami-Dade';
  address: string;
  city: string;
  coordinates: [number, number];
  services: Service[];
  phone?: string;
  website: string;
  insurance: string[];
  affordability: 'sliding-scale' | 'unknown';
  sources: { url: string; title: string; checkedAt: string; fields: string[] }[];
  verification: 'reviewed';
}
export interface Appointment {
  id: string;
  provider: string;
  date: string;
  time: string;
  duration: number;
}
export const services: Service[] = [
  'Pap / HPV screening',
  'HPV vaccination',
  'Annual gynecology',
  'PCOS',
  'Fibroids',
  'Birth control',
];
export const kinds: Record<ProviderKind, { label: string; color: string }> = {
  community: { label: 'Community & low-cost', color: '#ee8eaf' },
  private: { label: 'Private gynecology', color: '#b4a1df' },
  hospital: { label: 'Hospitals & health systems', color: '#90bfdf' },
  preventive: { label: 'Vaccination & prevention', color: '#86c6b1' },
};
