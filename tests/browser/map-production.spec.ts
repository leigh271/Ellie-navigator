import { test, expect } from '@playwright/test';
const background = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dceae0' } }],
};
const raster = {
  version: 8,
  sources: {
    fixture: {
      type: 'raster',
      tiles: ['https://fixture-map.test/tiles/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'Synthetic tile attribution — test only',
    },
  },
  layers: [{ id: 'raster', type: 'raster', source: 'fixture' }],
};
const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
async function showMap(page: import('@playwright/test').Page, mobile: boolean) {
  await page.goto('/');
  if (mobile) await page.getByRole('button', { name: 'Show map', exact: true }).click();
}
test('production bundle exposes map before slow tiles finish, with attribution and correctly sized canvas', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  let requested = 0;
  await page.route('https://tiles.openfreemap.org/styles/positron', (r) =>
    r.fulfill({ json: raster }),
  );
  await page.route('https://fixture-map.test/tiles/**', async (r) => {
    requested++;
    await gate;
    await r.fulfill({ contentType: 'image/png', body: pixel });
  });
  try {
    await showMap(page, isMobile);
    await expect(page.locator('.map-shell')).toHaveAttribute('data-map-state', 'ready');
    await expect(page.locator('.live-map')).toHaveCSS('opacity', '1');
    await expect(page.locator('.regional-map')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeEnabled();
    await expect.poll(() => requested).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.locator('.maplibregl-canvas').evaluate((el) => el.getBoundingClientRect().width),
      )
      .toBeGreaterThan(200);
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await page.getByRole('button', { name: 'Fit map to matching providers' }).click();
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText(
      'Synthetic tile attribution',
    );
    release();
    await expect(page.locator('.map-status')).toHaveCount(0, { timeout: 10000 });
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});
test('production map keeps usable geography visible when a tile fails', async ({
  page,
  isMobile,
}) => {
  await page.route('https://tiles.openfreemap.org/styles/positron', (r) =>
    r.fulfill({ json: raster }),
  );
  await page.route('https://fixture-map.test/tiles/**', (r) =>
    r.fulfill({ status: 503, body: 'Test tile service unavailable' }),
  );
  await showMap(page, isMobile);
  await expect(page.locator('.map-status')).toContainText(
    'Some map tiles or labels could not load',
  );
  await expect(page.locator('.map-shell')).toHaveAttribute('data-map-state', 'ready');
  await expect(page.locator('.live-map')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeEnabled();
});
test('production map retries a failed style without duplicate canvases', async ({
  page,
  isMobile,
}) => {
  let attempts = 0;
  await page.route('https://tiles.openfreemap.org/styles/positron', (r) =>
    ++attempts === 1
      ? r.fulfill({ status: 503, body: 'Test style unavailable' })
      : r.fulfill({ json: background }),
  );
  await showMap(page, isMobile);
  await expect(page.locator('.map-shell')).toHaveAttribute('data-map-state', 'unavailable');
  await expect(page.locator('.map-status')).toContainText('not to scale');
  await page.getByRole('button', { name: 'Reload map', exact: true }).click();
  await expect(page.locator('.map-shell')).toHaveAttribute('data-map-state', 'ready');
  await expect(page.locator('.maplibregl-canvas')).toHaveCount(1);
  await expect(page.locator('.regional-map')).toBeHidden();
});
