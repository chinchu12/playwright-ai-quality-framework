import { Locator, Page, TestInfo } from '@playwright/test';
import { BasePage } from './base-page';

export class ProfilePage extends BasePage {
  readonly countrySelect: Locator;

  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);

    // Intentionally incorrect locator for AI healing demo
    this.countrySelect = page.getByRole('combobox', {
      name: 'Select region',
    });
  }

  async open(): Promise<void> {
    await this.page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>User Profile</title>
        </head>

        <body>
          <main>
            <h1>User Profile</h1>

            <label for="country">
              Country
            </label>

            <select
              id="country"
              aria-label="Country selector"
              data-testid="country-select"
            >
              <option value="">Choose a country</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
            </select>
          </main>
        </body>
      </html>
    `);
  }

  async selectCountry(value: string): Promise<void> {
    await this.safeSelectOption(
      this.countrySelect,
      "getByRole('combobox', { name: 'Select region' })",
      value
    );
  }
}