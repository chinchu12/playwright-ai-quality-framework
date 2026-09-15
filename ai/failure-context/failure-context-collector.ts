import { Page, TestInfo } from '@playwright/test';
import {
  FailureContext,
  InteractiveElement,
} from './failure-context';

export async function collectFailureContext(
  page: Page,
  testInfo: TestInfo,
  error: Error,
  locator?: string,
  action?: string
): Promise<FailureContext> {
  const timestamp = new Date().toISOString();

  const screenshotPath = `test-results/failure-${Date.now()}.png`;

  const pageTitle = await page.title();

  const visibleText = await page.locator('body').innerText();

  const interactiveElements: InteractiveElement[] =
    await page.locator('a, button, input, [role]').evaluateAll((elements) =>
      elements.map((element) => {
        const htmlElement = element as HTMLElement;
        const anchor = element as HTMLAnchorElement;

        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          text: htmlElement.innerText?.trim() ?? '',
          ariaLabel: element.getAttribute('aria-label'),
          href: anchor.href || null,
        };
      })
    );

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  return {
    testName: testInfo.title,
    url: page.url(),
    pageTitle,
    visibleText,
    interactiveElements,
    errorMessage: error.message,
    locator,
    action,
    screenshotPath,
    timestamp,
  };
}