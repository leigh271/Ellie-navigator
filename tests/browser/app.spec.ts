import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function navigate(page: import('@playwright/test').Page, title: string, mobile: boolean) {
  await page
    .getByRole('navigation', {
      name: mobile ? 'Mobile navigation' : 'Main navigation',
      exact: true,
    })
    .getByRole('button', { name: title, exact: title !== 'Ask Ellie' })
    .click();
}
test('care discovery, filters, navigation and resources are honest and responsive', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Women’s health, closer to you.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start with trusted sources' })).toBeVisible();
  await expect(page.locator('.wordmark')).toHaveCSS('font-family', /DM Sans/);
  await expect(page.locator('[class*="sparkle"], .lucide-sparkles')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open official directory' })).toHaveCount(3);
  await expect(page.locator('#insurance-help')).toContainText(
    'not your member ID or policy number',
  );
  await page.getByLabel('Healthcare service').selectOption('PCOS');
  await expect(page.getByText('0 reviewed matches')).toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('Affordability', { exact: true }).selectOption('sliding-scale');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByLabel('Healthcare service')).toHaveValue('');
  if (isMobile) {
    await page.getByRole('button', { name: 'Show map' }).click();
    await expect(page.getByLabel('South Florida provider map')).toBeVisible();
    await page.getByRole('button', { name: 'Show list' }).click();
  }
  await navigate(page, 'Resources', isMobile);
  await expect(
    page.getByRole('link', { name: /Understanding cervical screening/ }),
  ).toHaveAttribute('href', 'https://www.cdc.gov/cervical-cancer/screening/index.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
test('personal appointments persist, edit, export, and delete without claiming a booking', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await navigate(page, 'My Care', isMobile);
  await page.getByRole('button', { name: 'Add appointment', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('doesn’t book a clinic visit');
  await dialog.getByLabel('Clinic or provider').fill('Test personal record');
  await dialog.getByLabel('Date', { exact: true }).fill('2030-01-15');
  await dialog.getByLabel('Time', { exact: true }).fill('09:30');
  await dialog.getByRole('combobox', { name: 'Remind me', exact: true }).selectOption('15');
  await dialog.getByRole('button', { name: 'Save personal appointment' }).click();
  await expect(page.getByRole('heading', { name: 'Test personal record' })).toBeVisible();
  await page.getByLabel('Calendar month', { exact: true }).fill('2030-01');
  await page.getByRole('button', { name: '2030-01-15, 1 appointments', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Selected day', exact: true })).toBeVisible();
  await page.reload();
  await navigate(page, 'My Care', isMobile);
  await expect(page.getByRole('heading', { name: 'Test personal record' })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export Test personal record to Apple Calendar' }).click(),
  ]);
  const file = await readFile((await download.path())!, 'utf8');
  expect(file).toContain('DTSTART:20300115T143000Z');
  expect(file).toContain('Personal calendar record only');
  expect(file).toContain('BEGIN:VALARM');
  expect(file).toContain('TRIGGER:-PT15M');
  await expect(page.getByText('15 minutes before', { exact: true })).toBeVisible();
  await expect(page.locator('.calendar-tools-note')).toContainText('not connected or synced');
  await expect(
    page.getByRole('link', { name: 'Add Test personal record to Google Calendar' }),
  ).toHaveAttribute('href', /calendar.google.com/);
  await page.getByRole('button', { name: 'Edit Test personal record', exact: true }).click();
  await expect(dialog.getByRole('combobox', { name: 'Remind me', exact: true })).toHaveValue('15');
  await dialog.getByLabel('Clinic or provider').fill('Edited personal record');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Edited personal record' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Edited personal record', exact: true }).click();
  await page.getByRole('button', { name: 'Delete record', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edited personal record' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('rule-based Ellie answers locally and handles boundaries', async ({ page, isMobile }) => {
  let sent = false;
  page.on('request', (req) => {
    if (req.url().includes('/api/ask')) sent = true;
  });
  await page.goto('/');
  await navigate(page, 'Ask Ellie', isMobile);
  await expect(page.getByText('Rule-based guide', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'How can I find affordable care?' }).click();
  await expect(page.getByRole('log')).toContainText('does not have verified pricing');
  await page
    .getByRole('textbox', { name: 'Ask Ellie a navigation question' })
    .fill('diagnose my symptoms');
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('cannot diagnose');
  expect(sent).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('API validates requests and returns labeled fallback without a key', async ({ request }) => {
  const nullBody = await request.post('/api/ask', {
    data: 'null',
    headers: { 'Content-Type': 'application/json' },
  });
  expect(nullBody.status()).toBe(400);
  const bad = await request.post('/api/ask', { data: { message: '' } });
  expect(bad.status()).toBe(400);
  const oversized = await request.post('/api/ask', { data: { message: 'x'.repeat(7000) } });
  expect(oversized.status()).toBe(413);
  const crossOrigin = await request.post('/api/ask', {
    headers: { Origin: 'https://example.org' },
    data: { message: 'hello' },
  });
  expect(crossOrigin.status()).toBe(403);
  const good = await request.post('/api/ask', { data: { message: 'book an appointment' } });
  expect(good.ok()).toBe(true);
  expect(await good.json()).toMatchObject({ mode: 'rule-based' });
});
