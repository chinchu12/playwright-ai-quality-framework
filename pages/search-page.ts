import { Locator, Page, TestInfo } from '@playwright/test';
import { BasePage } from './base-page';

export class SearchPage extends BasePage {
  readonly searchInput: Locator;

  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);

    // Intentionally incorrect accessible name.
    this.searchInput = page.getByRole('textbox', {
      name: 'Search products',
    });
  }

  async open(): Promise<void> {
    await this.page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Product Search</title>
        </head>

        <body>
          <main>
            <h1>Product Catalogue</h1>

            <label for="product-search">
              Find a product
            </label>

            <input
              id="product-search"
              type="text"
              aria-label="Product search"
              placeholder="Search catalogue"
            />

            <button type="button">
              Search
            </button>
          </main>
        </body>
      </html>
    `);
  }

  async searchFor(value: string): Promise<void> {
    await this.safeFill(
      this.searchInput,
      "getByRole('textbox', { name: 'Search products' })",
      value
    );
  }
}