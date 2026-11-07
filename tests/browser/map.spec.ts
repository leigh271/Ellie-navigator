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
  isMobile,
}) => {
  test.skip(
    isMobile,
    'Isolated desktop component harness; the mobile application flows are covered separately.',
  );
  await page.route('http://map-harness.test/**', (route) => {
    if (route.request().url().endsWith('/harness.js'))
      return route.fulfill({ contentType: 'application/javascript', body: bundle });
    return route.fulfill({
      contentType: 'text/html',
      body: `<html><head><style>${styles}</style></head><body><div id="root"></div><script src="/harness.js"></script></body></html>`,
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
  const marker = page.getByRole('button', { name: 'Select Synthetic test fixture A', exact: true });
  await expect(marker).toBeVisible({ timeout: 20000 });
  await marker.click();
  await expect(page.locator('#provider-fixture-a')).toHaveClass(/active/);
  await expect(marker).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Synthetic test fixture B', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Select Synthetic test fixture B', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#provider-fixture-a')).not.toHaveClass(/active/);
  await page.getByRole('button', { name: 'Save Synthetic test fixture A', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('1 saved test fixtures');
  await page.getByRole('button', { name: 'Unsave Synthetic test fixture A', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('0 saved test fixtures');
});
