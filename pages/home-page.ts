import { Locator, Page, TestInfo } from '@playwright/test';
import { BasePage } from './base-page';

export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly moreInformationLink: Locator;

  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);

    this.heading = page.getByRole('heading');

    // Intentionally incorrect locator for our failure-context demo
    this.moreInformationLink = page.getByRole('link', {
      name: 'More details',
    });
  }

  async open(): Promise<void> {
    await this.page.goto('https://example.com');
  }

  async getHeadingText(): Promise<string> {
    return await this.getText(this.heading);
  }

  async clickMoreInformation(): Promise<void> {
    await this.safeClick(
      this.moreInformationLink,
      "getByRole('link', { name: 'More details' })"
    );
  }
}