import { test, expect } from '@playwright/test';
async function myCare(page: import('@playwright/test').Page, mobile: boolean) {
  await page.goto('/');
  await page
    .getByRole('navigation', {
      name: mobile ? 'Mobile navigation' : 'Main navigation',
      exact: true,
    })
    .getByRole('button', { name: 'My Care', exact: true })
    .click();
}
test('browser reminders require opt-in and request a real browser notification without health details', async ({
  page,
  context,
  isMobile,
}) => {
  await context.grantPermissions(['notifications']);
  await page.addInitScript(() => {
    const Native = window.Notification;
    const requests: { title: string; body?: string }[] = [];
    Object.defineProperty(window, '__ellieNotificationRequests', { value: requests });
    window.Notification = new Proxy(Native, {
      get(target, key) {
        return Reflect.get(target, key, target);
      },
      construct(target, args) {
        const result = Reflect.construct(target, args);
        requests.push({ title: args[0], body: args[1]?.body });
        return result;
      },
    });
  });
  await myCare(page, isMobile);
  await expect(page.getByText('Browser reminders: off', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __ellieNotificationRequests: unknown[] })
          .__ellieNotificationRequests.length,
    ),
  ).toBe(0);
  await page.getByRole('button', { name: 'Enable browser reminders', exact: true }).click();
  await expect(
    page.getByText('Browser reminders: enabled while Ellie is open', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Send test reminder', exact: true }).click();
  await expect(page.getByText(/Test reminder requested/)).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __ellieNotificationRequests: { title: string }[] })
          .__ellieNotificationRequests[0].title,
    ),
  ).toBe('Ellie test reminder');
  // A due synthetic appointment stays in local test storage, never the provider directory.
  await page.evaluate(() => {
    const future = new Date(Date.now() + 20 * 60000);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(future);
    const part = (key: string) => parts.find((p) => p.type === key)!.value;
    localStorage.setItem(
      'ellie-appointments-v1',
      JSON.stringify([
        {
          id: 'due-test',
          provider: 'Synthetic private test name',
          date: `${part('year')}-${part('month')}-${part('day')}`,
          time: `${part('hour')}:${part('minute')}`,
          duration: 30,
          reminderMinutes: 30,
        },
      ]),
    );
    window.dispatchEvent(new Event('storage'));
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __ellieNotificationRequests: unknown[] })
            .__ellieNotificationRequests.length,
      ),
    )
    .toBe(2);
  const payload = await page.evaluate(
    () =>
      (window as unknown as { __ellieNotificationRequests: unknown[] })
        .__ellieNotificationRequests[1],
  );
  expect(JSON.stringify(payload)).not.toContain('Synthetic private test name');
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('ellie-reminders-sent-v1') || '[]').length,
      ),
    )
    .toBe(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __ellieNotificationRequests: unknown[] })
          .__ellieNotificationRequests.length,
    ),
  ).toBe(0);
  await myCare(page, isMobile);
  await page.getByRole('button', { name: 'Disable browser reminders', exact: true }).click();
  await expect(page.getByText('Browser reminders: off', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear my local data', exact: true }).click();
  await page.getByRole('button', { name: 'Delete all', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('ellie-reminders-sent-v1'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('ellie-browser-reminders-v1'))).toBeNull();
});
test('denied notifications never show enabled status and calendar fallback stays available', async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(() => {
    class DeniedNotification {
      static permission = 'denied';
      static async requestPermission() {
        return 'denied';
      }
      constructor() {
        throw new Error('Must never create a denied notification');
      }
    }
    Object.defineProperty(window, 'Notification', {
      value: DeniedNotification,
      configurable: true,
    });
  });
  await myCare(page, isMobile);
  await page.getByRole('button', { name: 'Enable browser reminders', exact: true }).click();
  await expect(page.getByText(/Notifications were not allowed/)).toBeVisible();
  await expect(page.getByText('Browser reminders: off', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add appointment', exact: true })).toBeEnabled();
});
test('unsupported notification browsers show a clear calendar alternative', async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'Notification', { value: undefined, configurable: true });
  });
  await myCare(page, isMobile);
  await expect(
    page.getByRole('button', { name: 'Enable browser reminders', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      'Tab-based notifications are unavailable in this browser. Calendar exports still work.',
    ),
  ).toBeVisible();
});
