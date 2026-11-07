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
