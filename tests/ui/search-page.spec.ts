import { test } from '@playwright/test';
import { SearchPage } from '../../pages/search-page';

test.describe('Search Page', () => {
  test('AI heals a broken search input locator @ai-healing', async ({ page }, testInfo) => {
    const searchPage = new SearchPage(page, testInfo);

    await searchPage.open();

    await searchPage.searchFor('Playwright AI testing');
  });
});