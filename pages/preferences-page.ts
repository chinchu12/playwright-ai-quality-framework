import { Locator, Page, TestInfo } from '@playwright/test';
import { BasePage } from './base-page';

export class PreferencesPage extends BasePage {
  readonly newsletterCheckbox: Locator;

  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);

    // Intentionally incorrect locator for AI healing demo
    this.newsletterCheckbox = page.getByRole('checkbox', {
      name: 'Receive product updates',
    });
  }

  async open(): Promise<void> {
    await this.page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Notification Preferences</title>
        </head>

        <body>
          <main>
            <h1>Notification Preferences</h1>

            <label for="marketing-email">
              Email notifications
            </label>

            <input
              id="marketing-email"
              type="checkbox"
              aria-label="Marketing emails"
              data-testid="marketing-email-checkbox"
            />
          </main>
        </body>
      </html>
    `);
  }

  async enableNewsletter(): Promise<void> {
    await this.safeCheck(
      this.newsletterCheckbox,
      "getByRole('checkbox', { name: 'Receive product updates' })"
    );
  }
}