import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const clinic = 'BROWARD COMMUNITY AND FAMILY HEALTH CENTER - LAUDERHILL';
const searchButton = (page: import('@playwright/test').Page) =>
  page
    .getByRole('region', { name: 'Filter care providers' })
    .getByRole('button', { name: 'Find Care', exact: true });
async function localBasemap(page: import('@playwright/test').Page) {
  await page.route('https://tiles.openfreemap.org/styles/positron', (r) =>
    r.fulfill({
      json: {
        version: 8,
        sources: {},
        layers: [{ id: 'test', type: 'background', paint: { 'background-color': '#e6efea' } }],
      },
    }),
  );
}
test('real directory search applies on submit, supports aliases and ZIP, and keeps unknown insurance visible', async ({
  page,
  isMobile,
}) => {
  await localBasemap(page);
  await page.goto('/');
  const results = page.getByRole('region', { name: 'Care results' });
  await expect(results.locator('.provider-card')).toHaveCount(14);
  await page.getByLabel('Location', { exact: true }).fill('Ft Lauderdale, FL');
  await expect(results.locator('.provider-card')).toHaveCount(14);
  await searchButton(page).click();
  await expect(results.locator('.provider-card')).toHaveCount(5);
  await expect(page.locator('.heart-marker')).toHaveCount(5);
  await expect(page.getByRole('status', { name: 'Result count' })).toHaveText(
    '5 location-sourced clinics',
  );
  if (isMobile) {
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByLabel('Insurance plan on mobile', { exact: true }).fill('Florida Blue');
  } else await page.getByLabel('Insurance plan', { exact: true }).fill('Florida Blue');
  await searchButton(page).click();
  await expect(results.locator('.provider-card')).toHaveCount(5);
  await expect(
    results.getByRole('heading', { name: 'Insurance acceptance unknown · contact clinic' }),
  ).toBeVisible();
  await expect(results.locator('.insurance-status.confirmed')).toHaveCount(0);
  await expect(results.locator('.insurance-status')).toHaveCount(5);
  await page.getByLabel('Location', { exact: true }).fill('33313');
  await searchButton(page).click();
  await expect(results.locator('#provider-hrsa-site-0003')).toBeVisible();
  await expect(results.locator('.nearby-badge').first()).toBeVisible();
  await expect(results.locator('.search-explanation')).toContainText('Approximate origin');
  const count = await results.locator('.provider-card').count();
  await expect(page.locator('.heart-marker')).toHaveCount(count);
  if (isMobile) {
    await page.getByRole('button', { name: 'Show map', exact: true }).click();
    await expect(page.locator('.map-shell')).toHaveAttribute('data-map-state', 'ready');
    await page.getByRole('button', { name: 'Recenter on search location' }).click();
    await page.getByRole('button', { name: 'Show list', exact: true }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('honest cervical-screening fallback leads through real clinic details, contact, favorite and calendar export', async ({
  page,
  isMobile,
}) => {
  await localBasemap(page);
  await page.goto('/');
  await page.getByLabel('Location', { exact: true }).fill('Fort Lauderdale, FL');
  await page.getByLabel('Healthcare service').selectOption('Cervical cancer screening');
  await searchButton(page).click();
  await expect(
    page.getByRole('heading', { name: 'No service-verified matches yet.' }),
  ).toBeVisible();
  await expect(page.locator('.heart-marker')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Browse general clinics · services unconfirmed', exact: true })
    .click();
  await expect(page.getByLabel('Healthcare service')).toHaveValue('');
  await expect(page.locator('.provider-card')).toHaveCount(5);
  if (isMobile) await page.getByRole('button', { name: 'Show map', exact: true }).click();
  await page.getByRole('button', { name: `Select ${clinic}`, exact: true }).click();
  await expect(page.locator('#provider-hrsa-site-0003')).toHaveClass(/active/);
  await page.getByRole('button', { name: `View details for ${clinic}`, exact: true }).click();
  const detail = page.getByRole('dialog');
  await expect(detail).toContainText('1295 NW 40th Ave');
  await expect(detail).toContainText('33313');
  await expect(detail).toContainText(
    'No location-specific women’s healthcare services have been independently confirmed',
  );
  await expect(detail.getByRole('link', { name: 'Call Clinic', exact: true })).toHaveAttribute(
    'href',
    'tel:+19545834710',
  );
  await expect(detail.getByRole('link', { name: 'Book with Clinic', exact: true })).toHaveCount(0);
  await expect(detail.getByRole('link', { name: 'Apple Maps directions' })).toHaveAttribute(
    'href',
    /26.143566%2C-80.202845/,
  );
  await detail.getByRole('button', { name: 'Save to My Care', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Saved to My Care', exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Save personal appointment', exact: true }).click();
  const appointment = page.getByRole('dialog');
  await expect(appointment.getByLabel('Clinic or provider')).toHaveValue(clinic);
  await appointment.getByLabel('Date', { exact: true }).fill('2030-01-15');
  await appointment.getByLabel('Time', { exact: true }).fill('09:30');
  await appointment.getByRole('combobox', { name: 'Remind me', exact: true }).selectOption('15');
  await appointment.getByRole('button', { name: 'Save personal appointment', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your care calendar', exact: true }),
  ).toBeVisible();
  const link = page.getByRole('link', { name: `Add ${clinic} to Google Calendar`, exact: true });
  await expect(link).toBeVisible();
  expect(new URL((await link.getAttribute('href'))!).searchParams.get('dates')).toBe(
    '20300115T143000Z/20300115T150000Z',
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: `Export ${clinic} to Apple Calendar`, exact: true }).click(),
  ]);
  const file = await readFile((await download.path())!, 'utf8');
  expect(file).toContain('TRIGGER:-PT15M');
  expect(file).toContain('Personal calendar record only');
  await expect(page.locator('.favorites-section .provider-card')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

for (const county of ['Broward', 'Miami-Dade']) {
  test(`manual insured and self-pay journeys in ${county} preserve unverified boundaries`, async ({
    page,
    isMobile,
  }) => {
    await localBasemap(page);
    await page.goto('/');
    await page.getByLabel('County', { exact: true }).selectOption(county);
    await page
      .getByLabel('Location', { exact: true })
      .fill(county === 'Broward' ? 'Fort Lauderdale' : 'Miami');
    await page.getByLabel('Healthcare service').selectOption('Pap test');
    await page.getByLabel('Insurance carrier', { exact: true }).selectOption('Florida Blue');
    await searchButton(page).click();
    await expect(
      page.getByRole('heading', { name: 'No service-verified matches yet.' }),
    ).toBeVisible();
    await expect(page.locator('.heart-marker')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Browse general clinics · services unconfirmed', exact: true })
      .click();
    const cards = page.locator('.provider-card');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(page.locator('.insurance-status.confirmed')).toHaveCount(0);
    await expect(cards.first()).toContainText('Insurance unknown');
    const total = await cards.count();
    await expect(page.locator('.heart-marker')).toHaveCount(total);
    await cards
      .first()
      .getByRole('button', { name: /View details for/ })
      .click();
    const detail = page.getByRole('dialog');
    await expect(detail).toContainText(`${county} County`);
    await expect(detail).toContainText('No verified online booking link');
    await expect(detail.getByRole('link', { name: 'Call Clinic', exact: true })).toHaveAttribute(
      'href',
      /^tel:/,
    );
    const demo = detail.getByRole('region', { name: 'Synthetic scheduling demo' });
    await expect(demo).toContainText('Simulation only');
    await demo.getByRole('button', { name: 'Demo morning · 9:00 AM' }).click();
    await demo.getByRole('button', { name: 'Simulate appointment request' }).click();
    await expect(demo.getByRole('status')).toContainText('Nothing was sent or booked');
    await detail.getByRole('button', { name: 'Close provider details' }).click();
    await page.getByLabel('Insurance carrier', { exact: true }).selectOption('self-pay');
    await page.getByLabel('Healthcare service').selectOption('Pap test');
    await searchButton(page).click();
    await expect(
      page.getByRole('heading', { name: 'No service-verified matches yet.' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Browse general clinics · services unconfirmed', exact: true })
      .click();
    await expect(cards.first()).toContainText('Self-pay: unknown');
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Care map', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Map view', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Care results', exact: true })).toBeHidden();
    await expect(page.locator('.map-shell')).toBeVisible();
    await page.getByRole('button', { name: 'Map + list', exact: true }).click();
    if (isMobile)
      await expect(page.getByRole('button', { name: 'Show map', exact: true })).toBeVisible();
    await page.getByLabel('Location', { exact: true }).fill('00000');
    await searchButton(page).click();
    await expect(
      page.getByRole('heading', { name: 'ZIP code not found in this directory.' }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test('clinic partner preview stages only synthetic requests and cannot publish directory updates', async ({
  page,
}) => {
  await page.goto('/partners');
  await expect(
    page.getByRole('heading', { name: 'Clinic partner preview', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('note')).toContainText('no live accounts or authorization');
  await page.getByLabel('Sample work email').fill('demo@example.org');
  await page.getByLabel('Sample role').fill('Fictional clinic manager');
  await page.getByLabel('I am using fictional details for this prototype.').check();
  await page.getByRole('button', { name: 'Simulate listing claim' }).click();
  await expect(page.getByRole('status')).toContainText('No account was created');
  await page.getByRole('button', { name: 'Manage listing', exact: true }).click();
  await page.getByLabel('Pap test', { exact: true }).check();
  await page.getByRole('button', { name: 'Stage demo update' }).click();
  await expect(page.getByRole('status')).toContainText('public listing has not changed');
  await expect(page.getByLabel('Staged sample listing')).toContainText('Sample services: Pap test');
  await page.getByRole('button', { name: 'Demo requests', exact: true }).click();
  await page.getByRole('button', { name: 'Manage listing', exact: true }).click();
  await expect(page.getByLabel('Pap test', { exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Demo slots', exact: true }).click();
  await page.getByLabel('Demo date').fill('2030-01-15');
  await page.getByLabel('Demo time').fill('09:00');
  await page.getByRole('button', { name: 'Add synthetic slot' }).click();
  await expect(page.getByText('2030-01-15 at 09:00 · synthetic')).toBeVisible();
  await page.getByRole('button', { name: 'Demo requests', exact: true }).click();
  await page.getByRole('button', { name: 'Generate fictional request' }).click();
  await expect(page.getByText(/Demo request 1 · fictional patient/)).toBeVisible();
  await page.getByRole('button', { name: 'Demo analytics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Preview session activity' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/');
  await expect(page.locator('.provider-card')).toHaveCount(14);
  await expect(page.locator('.provider-card').first()).toContainText('services not yet confirmed');
});
