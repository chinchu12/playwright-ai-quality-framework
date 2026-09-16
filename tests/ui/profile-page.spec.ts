import { expect, test } from '@playwright/test';
import { ProfilePage } from '../../pages/profile-page';

test.describe('Profile Page', () => {
  test('AI heals a broken combobox locator', async ({ page }, testInfo) => {
    const profilePage = new ProfilePage(page, testInfo);

    await profilePage.open();

    await profilePage.selectCountry('DE');

    await expect(
      page.getByTestId('country-select')
    ).toHaveValue('DE');
  });
});