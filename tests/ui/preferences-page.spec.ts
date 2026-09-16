import { expect, test } from '@playwright/test';
import { PreferencesPage } from '../../pages/preferences-page';

test.describe('Preferences Page', () => {
  test('AI heals a broken checkbox locator', async ({ page }, testInfo) => {
    const preferencesPage = new PreferencesPage(page, testInfo);

    await preferencesPage.open();

    await preferencesPage.enableNewsletter();

    await expect(
      page.getByTestId('marketing-email-checkbox')
    ).toBeChecked();
  });
});