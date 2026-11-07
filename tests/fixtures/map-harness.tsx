// Isolated synthetic fixtures for browser component tests. Never imported by the app.
import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CareMap from '../../src/components/care-map';
import ProviderCard from '../../src/components/provider-card';
import type { Provider } from '../../src/lib/types';
const fixtures: Provider[] = [
  {
    id: 'fixture-a',
    name: 'Synthetic test fixture A',
    kind: 'community',
    county: 'Broward',
    address: 'TEST ONLY',
    city: 'TEST ONLY',
    coordinates: [-80.2, 26.1],
    services: ['HPV vaccination'],
    website: 'https://example.org',
    insurance: [],
    affordability: 'unknown',
    verification: 'reviewed',
    sources: [
      { title: 'Test only', url: 'https://example.org', checkedAt: '2026-01-01', fields: ['test'] },
    ],
  },
  {
    id: 'fixture-b',
    name: 'Synthetic test fixture B',
    kind: 'hospital',
    county: 'Miami-Dade',
    address: 'TEST ONLY',
    city: 'TEST ONLY',
    coordinates: [-80.15, 25.8],
    services: ['Annual gynecology'],
    website: 'https://example.org',
    insurance: [],
    affordability: 'unknown',
    verification: 'reviewed',
    sources: [
      { title: 'Test only', url: 'https://example.org', checkedAt: '2026-01-01', fields: ['test'] },
    ],
  },
];
function Harness() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const select = useCallback((id: string) => setSelected(id), []);
  return (
    <div>
      <h1>Isolated map component test — synthetic fixtures</h1>
      <p role="status">{saved.length} saved test fixtures</p>
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 20 }}>
        <div>
          {fixtures.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={selected === p.id}
              saved={saved.includes(p.id)}
              onSelect={() => select(p.id)}
              onSave={() =>
                setSaved((items) =>
                  items.includes(p.id) ? items.filter((x) => x !== p.id) : [...items, p.id],
                )
              }
              onAppointment={() => {}}
            />
          ))}
        </div>
        <div style={{ height: 600 }}>
          <CareMap providers={fixtures} selected={selected} onSelect={select} />
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<Harness />);
