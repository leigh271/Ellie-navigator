import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
let bundle: string;
let styles: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ['tests/fixtures/map-harness.tsx'],
    bundle: true,
    write: false,
    outfile: 'harness.js',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    tsconfig: 'tsconfig.json',
  });
  bundle = result.outputFiles[0].text;
  styles =
    (await readFile('src/app/globals.css', 'utf8'))
      .replace('@import "tailwindcss";', '')
      .replace("@import 'tailwindcss';", '') +
    (await readFile(path.resolve('node_modules/maplibre-gl/dist/maplibre-gl.css'), 'utf8'));
});
test('actual map markers select actual provider cards, and hearts toggle saved state', async ({
  page,
}) => {
  await page.route('http://map-harness.test/**', (route) => {
    if (route.request().url().endsWith('/harness.js'))
      return route.fulfill({ contentType: 'application/javascript', body: bundle });
    return route.fulfill({
      contentType: 'text/html',
      body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles} .test-grid{display:grid;grid-template-columns:350px minmax(0,1fr);gap:20px}@media(max-width:620px){.test-grid{grid-template-columns:minmax(0,1fr)}}</style></head><body><div id="root"></div><script src="/harness.js"></script></body></html>`,
    });
  });
  // A deterministic, local empty basemap exercises real WebGL/MapLibre without claiming live tile access.
  await page.route('https://tiles.openfreemap.org/styles/positron', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 8,
        sources: {},
        layers: [
          { id: 'test-background', type: 'background', paint: { 'background-color': '#edf2ee' } },
        ],
      }),
    }),
  );
  await page.goto('http://map-harness.test/');
  await page.getByRole('button', { name: 'Show test map', exact: true }).click();
  await expect
    .poll(() =>
      page.locator('.maplibregl-canvas').evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(200);
  const marker = page.getByRole('button', { name: 'Select Synthetic test fixture A', exact: true });
  await expect(marker).toBeVisible({ timeout: 20000 });
  await marker.focus();
  const originalMarker = await marker.elementHandle();
  await marker.press('Enter');
  expect(await originalMarker!.evaluate((el) => el === document.activeElement)).toBe(true);
  await expect(page.locator('#provider-fixture-a')).toHaveClass(/active/);
  await expect(marker).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Synthetic test fixture B', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Select Synthetic test fixture B', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#provider-fixture-a')).not.toHaveClass(/active/);
  await page.getByRole('button', { name: 'Save Synthetic test fixture A', exact: true }).click();
  await expect(page.getByText('1 saved test fixtures', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unsave Synthetic test fixture A', exact: true }).click();
  await expect(page.getByText('0 saved test fixtures', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Directions to Synthetic test fixture A' }),
  ).toHaveAttribute('href', /destination=26.1%2C-80.2/);
  await page.getByRole('button', { name: 'Fit map to matching providers' }).click();
  await expect
    .poll(() =>
      page.locator('.heart-marker').evaluateAll((elements) =>
        elements.every((el) => {
          const bounds = el.closest('.map-shell')!.getBoundingClientRect();
          const marker = el.getBoundingClientRect();
          return (
            marker.left >= bounds.left &&
            marker.right <= bounds.right &&
            marker.top >= bounds.top &&
            marker.bottom <= bounds.bottom
          );
        }),
      ),
    )
    .toBe(true);
  const separation = () =>
    page.locator('.heart-marker').evaluateAll((elements) => {
      const a = elements[0].getBoundingClientRect();
      const b = elements[1].getBoundingClientRect();
      return Math.hypot(a.x - b.x, a.y - b.y);
    });
  const beforeZoom = await separation();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(separation).toBeGreaterThan(beforeZoom * 1.4);
  await page.getByRole('button', { name: 'Toggle test provider filter' }).click();
  await expect(page.locator('.heart-marker')).toHaveCount(1);
  await page.getByRole('button', { name: 'Hide test map' }).click();
  await page.getByRole('button', { name: 'Show test map' }).click();
  await expect
    .poll(() =>
      page.locator('.maplibregl-canvas').evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
