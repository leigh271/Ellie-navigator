import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  providers,
  searchCareProviders,
  normalizeLocation,
  milesBetween,
  type Filters,
} from '../src/lib/providers';
import {
  supportsService,
  insuranceStatus,
  verifiedBookingURL,
  phoneURL,
} from '../src/lib/provider-evidence';
import { parseProviderDataset } from '../src/lib/provider-schema';
import type { Provider } from '../src/lib/types';
const filters: Filters = { location: '', service: '', insurance: '', affordability: '' };
function fixture(id: string, coordinates: [number, number], city = 'Fort Lauderdale'): Provider {
  return {
    id,
    name: `Synthetic test ${id}`,
    address: 'Test fixture, not a clinic',
    city,
    county: 'Broward',
    zip: '33301',
    coordinates,
    kind: 'community',
    services: ['Pap test'],
    insurance: [],
    affordability: 'unknown',
    website: 'https://example.org',
    verification: 'reviewed',
    sources: [
      {
        url: 'https://example.org',
        title: 'Synthetic test evidence',
        checkedAt: '2026-11-07',
        fields: ['address', 'coordinates', 'Pap test'],
      },
    ],
  };
}
test('city/state/ZIP normalization preserves Fort Lauderdale aliases and county queries', () => {
  for (const q of [
    'Ft Lauderdale',
    'Ft. Lauderdale',
    'Fort Lauderdale, FL',
    'Fort Lauderdale,FL',
    'Fort Lauderdale, Florida',
  ])
    assert.equal(normalizeLocation(q), 'fort lauderdale');
  assert.equal(normalizeLocation('33313-1234'), '33313');
  assert.equal(normalizeLocation('Miami-Dade County, FL'), 'miami dade');
  const a = searchCareProviders(providers, { ...filters, location: 'Ft Lauderdale, FL' });
  const b = searchCareProviders(providers, { ...filters, location: 'Fort Lauderdale' });
  assert.deepEqual(
    a.items.map((i) => i.provider.id),
    b.items.map((i) => i.provider.id),
  );
  assert.ok(a.exact.length > 0);
  assert.ok(
    searchCareProviders(providers, { ...filters, location: '33313' }).exact.some(
      (p) => p.id === 'hrsa-site-0003',
    ),
  );
  assert.equal(
    searchCareProviders(providers, { ...filters, location: 'Miami-Dade county' }).exact.length,
    3,
  );
  const southMiami = searchCareProviders(providers, { ...filters, location: 'South Miami' });
  assert.equal(southMiami.exact[0].id, 'hrsa-site-0191');
  assert.equal(southMiami.anchorFound, true);
  assert.ok(southMiami.nearby.length > 0);
});
test('location-only imports cannot satisfy Pap, HPV or broad cervical screening', () => {
  for (const service of ['Pap test', 'HPV testing', 'Cervical cancer screening', 'HPV vaccination'])
    assert.equal(
      searchCareProviders(providers, { ...filters, location: 'Fort Lauderdale, FL', service }).items
        .length,
      0,
    );
  const pap = fixture('pap', [-80.14, 26.12]);
  assert.equal(supportsService(pap, 'Pap test'), true);
  assert.equal(supportsService(pap, 'HPV testing'), false);
  assert.equal(supportsService(pap, 'Cervical cancer screening'), true);
  const unsupported = { ...pap, services: ['HPV testing'] as Provider['services'] };
  assert.equal(supportsService(unsupported, 'HPV testing'), false);
});
test('insurance blank includes eligible clinics; unknown is retained and never promoted to accepted', () => {
  const unknown = fixture('unknown', [-80.14, 26.12]);
  const accepted = { ...fixture('accepted', [-80.15, 26.12]), insurance: ['Florida Blue PPO'] };
  accepted.sources[0].fields.push('insurance:Florida Blue PPO');
  const declined = {
    ...fixture('declined', [-80.16, 26.12]),
    insuranceDeclined: ['Florida Blue PPO'],
  };
  declined.sources[0].fields.push('insuranceDeclined:Florida Blue PPO');
  assert.equal(searchCareProviders([unknown, accepted, declined], filters).items.length, 3);
  const r = searchCareProviders([unknown, accepted, declined], {
    ...filters,
    insurance: 'Florida Blue PPO',
  });
  assert.equal(r.items[0].provider.id, 'accepted');
  assert.equal(r.items[0].insurance, 'confirmed');
  assert.equal(r.insuranceUnknown[0].id, 'unknown');
  assert.equal(r.declinedCount, 1);
  assert.equal(insuranceStatus(unknown, 'Florida Blue'), 'unknown');
  assert.equal(
    searchCareProviders(providers, { ...filters, insurance: 'Florida Blue' }).items.length,
    14,
  );
});
test('nearby expansion keeps the requested service and labels distance from a documented data-derived origin', () => {
  const exact = fixture('exact', [-80.14, 26.12]);
  const nearby = fixture('nearby', [-80.16, 26.18], 'Nearby fixture city');
  const distant = fixture('distant', [-80.3, 25.9], 'Distant fixture city');
  const vaccine = {
    ...fixture('vaccine', [-80.14, 26.13], 'Nearby fixture city'),
    services: ['HPV vaccination'] as Provider['services'],
  };
  vaccine.sources[0].fields = ['address', 'coordinates', 'HPV vaccination'];
  const r = searchCareProviders([exact, nearby, distant, vaccine], {
    ...filters,
    location: 'Fort Lauderdale',
    service: 'Pap test',
  });
  assert.equal(r.exact.length, 1);
  assert.equal(r.nearby.length, 2);
  assert.equal(r.radiusUsed, 25);
  assert.ok(r.items.filter((i) => i.nearby).every((i) => i.distanceMiles != null));
  assert.ok(!r.items.some((i) => i.provider.id === 'vaccine'));
  assert.match(r.originLabel || '', /Approximate origin/);
  const narrow = searchCareProviders(
    [exact, nearby, distant],
    { ...filters, location: 'Fort Lauderdale', service: 'Pap test' },
    10,
  );
  assert.equal(narrow.nearby.length, 1);
  const far = { ...fixture('far', [-80.3, 25.55], 'Far fixture'), county: 'Miami-Dade' as const };
  assert.equal(
    searchCareProviders([exact, far], {
      ...filters,
      location: 'Fort Lauderdale',
      service: 'Pap test',
    }).radiusUsed,
    50,
  );
  assert.ok(Math.abs(milesBetween([-80, 26], [-80, 27]) - 69.1) < 1);
});
test('provider-name and unknown-location searches do not silently search unrelated cities', () => {
  const p = providers[0];
  assert.equal(searchCareProviders(providers, { ...filters, location: p.name }).exact[0].id, p.id);
  const none = searchCareProviders(providers, {
    ...filters,
    location: 'A place absent from the extract',
  });
  assert.equal(none.items.length, 0);
  assert.equal(none.anchorFound, false);
});
test('publication rejects invented services, malformed coordinates and unsafe websites', () => {
  const p = providers[0];
  assert.throws(() => parseProviderDataset([{ ...p, coordinates: [26, -80] }]));
  assert.throws(() => parseProviderDataset([{ ...p, services: ['Pap test'] }]));
  assert.throws(() => parseProviderDataset([{ ...p, website: 'javascript:alert(1)' }]));
  assert.throws(() => parseProviderDataset([p, p]));
  assert.equal(verifiedBookingURL({ ...p, bookingUrl: 'https://example.org/book' }), null);
  assert.equal(phoneURL('305-576-6611 x608'), 'tel:+13055766611;ext=608');
});
