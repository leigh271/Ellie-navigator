export type ProviderKind = 'community' | 'private' | 'hospital' | 'preventive';
export type Service =
  | 'Cervical cancer screening'
  | 'Pap test'
  | 'HPV testing'
  | 'HPV vaccination'
  | 'Annual gynecology / wellness'
  | 'Birth control / family planning'
  | 'PCOS care'
  | 'Fibroid care'
  | 'Gynecology / OB-GYN'
  | 'STI / sexual health testing'
  | 'Breast health / mammography'
  | 'Primary care / women’s preventive health'
  | 'Women’s health specialty care'
  | 'Pap / HPV screening'
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
  website: string | null;
  organization?: string;
  state?: string;
  zip?: string;
  bookingUrl?: string;
  insuranceDeclined?: string[];
  insuranceParticipation?: {
    carrier: string;
    plan?: string;
    scope: 'organization' | 'location' | 'provider-network';
    sourceUrl: string;
    checkedAt: string;
  }[];
  selfPay?: boolean;
  schedulingPhone?: string;
  hrsa?: {
    sourceId: string;
    sourceRecordDate: string;
    sourceName: string;
    sourceURL: string;
    locationType: string;
    setting: string;
    status: string;
    serviceVerification: string;
    insuranceVerification: string;
  };
  insurance: string[];
  affordability: 'sliding-scale' | 'unknown';
  sources: {
    url: string;
    title: string;
    checkedAt: string;
    fields: string[];
    recordDate?: string;
    origin?: string;
  }[];
  verification: 'reviewed' | 'location';
}
export interface Appointment {
  id: string;
  provider: string;
  date: string;
  time: string;
  duration: number;
  reminderMinutes?: number | null;
}
export const services: Service[] = [
  'Cervical cancer screening',
  'Pap test',
  'HPV testing',
  'HPV vaccination',
  'Annual gynecology / wellness',
  'Birth control / family planning',
  'PCOS care',
  'Fibroid care',
  'Gynecology / OB-GYN',
  'STI / sexual health testing',
  'Breast health / mammography',
  'Primary care / women’s preventive health',
  'Women’s health specialty care',
];
export const kinds: Record<ProviderKind, { label: string; color: string }> = {
  community: { label: 'Community health centers', color: '#E77BAA' },
  private: { label: 'Private gynecology', color: '#AA86DB' },
  hospital: { label: 'Hospitals & health systems', color: '#75B5E9' },
  preventive: { label: 'Vaccination & prevention', color: '#2AAE9B' },
};
