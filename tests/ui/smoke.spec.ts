import { expect, test } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Example Domain loads successfully', async ({ page }) => {
    await page.goto('https://example.com');

    await expect(page).toHaveTitle('Example Domain');

    await expect(
      page.getByRole('heading', {
        name: 'Example Domain',
      })
    ).toBeVisible();

    await expect(
      page.getByRole('link', {
        name: 'Learn more',
      })
    ).toBeVisible();
  });
});