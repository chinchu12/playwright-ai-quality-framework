import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home-page';

test.describe('Home Page', () => {
  test('capture failure context for broken locator', async ({ page }, testInfo) => {
    const homePage = new HomePage(page, testInfo);

    await homePage.open();

    const headingText = await homePage.getHeadingText();
    expect(headingText).toContain('Example Domain');

    await homePage.clickMoreInformation();
  });
});