import records from '@/data/providers.json';
import type { Provider } from './types';
export const providers = records as Provider[];
export interface Filters {
  location: string;
  service: string;
  insurance: string;
  affordability: string;
}
export function filterProviders(data: Provider[], filters: Filters) {
  return data.filter((p) => {
    const text = `${p.name} ${p.city} ${p.county} ${p.address}`.toLowerCase();
    return (
      text.includes(filters.location.toLowerCase().trim()) &&
      (!filters.service || p.services.includes(filters.service as Provider['services'][number])) &&
      (!filters.insurance ||
        p.insurance.some((i) =>
          i.toLowerCase().includes(filters.insurance.toLowerCase().trim()),
        )) &&
      (!filters.affordability || p.affordability === filters.affordability)
    );
  });
}
