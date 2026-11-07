import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { providers } from '../src/lib/providers';
const raw = JSON.parse(readFileSync('data/hrsa/candidates.json', 'utf8')) as {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  county: string;
  phone: string;
  website: string | null;
  coordinates: number[];
}[];
const audit = JSON.parse(readFileSync('docs/HRSA_IMPORT_AUDIT.json', 'utf8'));
test('supplied CSV/JSON reconcile by location key and all 119 candidates pass structural checks', () => {
  const result = spawnSync(
    'python3',
    [
      '-c',
      'from scripts.import_hrsa import load_and_validate; a,b=load_and_validate(); print(len(a),len(b))',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '119 119');
  assert.deepEqual(audit.counties, { Broward: 25, 'Miami-Dade': 94 });
  for (const file of ['candidates.json', 'candidates.csv'])
    assert.equal(
      createHash('sha256')
        .update(readFileSync(`data/hrsa/${file}`))
        .digest('hex'),
      audit.sourceSHA256[file],
    );
});
test('published records preserve original HRSA locations and do not promote unknown services or insurance', () => {
  assert.equal(providers.length, 14);
  assert.equal(audit.publishedLocations, 14);
  for (const p of providers) {
    const r = raw.find((r) => r.id === p.id)!;
    assert.ok(r);
    for (const field of [
      'name',
      'address',
      'city',
      'zip',
      'county',
      'phone',
      'website',
      'coordinates',
    ] as const)
      assert.deepEqual(p[field], r[field]);
    assert.equal(p.verification, 'location');
    assert.deepEqual(p.services, []);
    assert.deepEqual(p.insurance, []);
    assert.equal(p.bookingUrl, undefined);
  }
  assert.equal(audit.serviceVerifiedProviders, 0);
  assert.equal(audit.verifiedBookingLinks, 0);
});
