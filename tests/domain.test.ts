import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createICS,
  appointmentUTC,
  googleCalendarURL,
  hasValidLocalTime,
  isValidAppointment,
} from '../src/lib/calendar';
import { filterProviders, providers } from '../src/lib/providers';
import { ruleBasedReply } from '../src/lib/assistant';
import type { Appointment, Provider } from '../src/lib/types';
const base: Appointment = {
  id: 'test-id',
  provider: 'Test fixture, not a real clinic; Éllie',
  date: '2030-01-15',
  time: '09:30',
  duration: 30,
};

test('calendar converts Eastern winter and summer times to UTC', () => {
  assert.equal(appointmentUTC(base).toISOString(), '2030-01-15T14:30:00.000Z');
  assert.equal(
    appointmentUTC({ ...base, date: '2030-07-15' }).toISOString(),
    '2030-07-15T13:30:00.000Z',
  );
});
test('calendar validates dates and rejects DST gap times', () => {
  assert.equal(isValidAppointment(base), true);
  assert.equal(isValidAppointment({ ...base, date: '2030-02-30' }), false);
  assert.equal(isValidAppointment({ ...base, time: '24:01' }), false);
  assert.equal(isValidAppointment({ ...base, duration: 10000 }), false);
  assert.equal(isValidAppointment({ ...base, date: undefined }), false);
  assert.equal(hasValidLocalTime({ ...base, date: '2030-03-10', time: '02:30' }), false);
  assert.equal(hasValidLocalTime({ ...base, date: '2030-11-03', time: '01:30' }), true);
});
test('ICS escapes user input and uses CRLF, UTF-8 line folding and correct end time', () => {
  const file = createICS({ ...base, provider: 'Clinic, One; Main\nFake field' });
  assert.match(file, /SUMMARY:Appointment: Clinic\\, One\\; Main\\nFake field/);
  assert.match(file, /DTSTART:20300115T143000Z/);
  assert.match(file, /DTEND:20300115T150000Z/);
  assert.equal(
    file.split('\r\n').every((line) => Buffer.byteLength(line) <= 75),
    true,
  );
  assert.equal(
    createICS({ ...base, provider: 'É'.repeat(100) })
      .split('\r\n')
      .every((l) => Buffer.byteLength(l) <= 75),
    true,
  );
  assert.match(file, /Personal calendar record only/);
  const google = new URL(googleCalendarURL(base));
  assert.equal(google.searchParams.get('ctz'), 'America/New_York');
  assert.equal(google.searchParams.get('dates'), '20300115T143000Z/20300115T150000Z');
});
test('filters combine documented services, location, insurance and cost without inferring unknowns', () => {
  // Synthetic unit-test fixture only. Never exported to application data.
  const fixture: Provider = {
    id: 'test-only',
    name: 'Synthetic unit-test fixture',
    county: 'Broward',
    city: 'Test City',
    kind: 'community',
    address: 'Not a real address',
    coordinates: [-80, 26],
    services: ['HPV vaccination'],
    website: 'https://example.org',
    insurance: ['Test insurance'],
    affordability: 'unknown',
    verification: 'reviewed',
    sources: [],
  };
  assert.equal(
    filterProviders([fixture], {
      location: ' BROWARD ',
      service: 'HPV vaccination',
      insurance: 'test',
      affordability: '',
    }).length,
    1,
  );
  assert.equal(
    filterProviders([fixture], { location: '', service: 'PCOS', insurance: '', affordability: '' })
      .length,
    0,
  );
  assert.equal(
    filterProviders([fixture], {
      location: '',
      service: '',
      insurance: 'unknown plan',
      affordability: '',
    }).length,
    0,
  );
  assert.equal(
    filterProviders([fixture], {
      location: '',
      service: '',
      insurance: '',
      affordability: 'sliding-scale',
    }).length,
    0,
  );
});
test('every shipped provider has source review and field evidence before publication', () => {
  const seen = new Set();
  for (const provider of providers) {
    assert.equal(provider.verification, 'reviewed');
    assert.ok(!seen.has(provider.id));
    seen.add(provider.id);
    assert.ok(provider.sources.length > 0);
    assert.ok(
      provider.sources.every(
        (s) =>
          new URL(s.url).protocol === 'https:' &&
          /^\d{4}-\d{2}-\d{2}$/.test(s.checkedAt) &&
          s.fields.length > 0,
      ),
    );
    assert.ok(provider.sources.some((s) => s.fields.includes('coordinates')));
    assert.ok(provider.sources.some((s) => s.fields.includes('address')));
    for (const service of provider.services)
      assert.ok(provider.sources.some((s) => s.fields.includes(service)));
    assert.ok(provider.coordinates[0] > -81 && provider.coordinates[0] < -79.8);
    assert.ok(provider.coordinates[1] > 25 && provider.coordinates[1] < 26.5);
  }
  // Empty data is deliberately allowed; this check does not establish live data readiness.
});
test('navigation guide sets emergency, diagnosis, booking, and directory boundaries', () => {
  assert.match(ruleBasedReply('I have chest pain'), /911/);
  assert.match(ruleBasedReply('Diagnose my symptoms'), /cannot diagnose/);
  assert.match(ruleBasedReply('Book an appointment'), /does not book/);
  assert.match(ruleBasedReply('Is insurance accepted?'), /does not have verified/);
  if (!providers.length)
    assert.match(ruleBasedReply('find a clinic in Broward'), /not populated yet/);
});

test('directions preserve exact clinic coordinates in latitude/longitude order', async () => {
  const { directionsURL } = await import('../src/lib/map');
  const url = new URL(directionsURL({ coordinates: [-80.234567, 26.123456] }));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('destination'), '26.123456,-80.234567');
});
