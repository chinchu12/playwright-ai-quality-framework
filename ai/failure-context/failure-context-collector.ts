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
    await page
      .locator('a, button, input, textarea, select, [role]')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const htmlElement = element as HTMLElement;
          const inputElement = element as HTMLInputElement;
          const anchorElement = element as HTMLAnchorElement;

          const id = element.getAttribute('id');

          let associatedLabel: string | null = null;

          if (id) {
            const label = document.querySelector(
              `label[for="${id}"]`
            );

            associatedLabel =
              label?.textContent?.trim() ?? null;
          }

          return {
            tag: element.tagName.toLowerCase(),
            role: element.getAttribute('role'),
            text: htmlElement.innerText?.trim() ?? '',
            ariaLabel: element.getAttribute('aria-label'),
            id,
            name: element.getAttribute('name'),
            type:
              'type' in inputElement && inputElement.type
                ? inputElement.type
                : null,
            placeholder:
              'placeholder' in inputElement &&
              inputElement.placeholder
                ? inputElement.placeholder
                : null,
            associatedLabel,
            href:
              element.tagName.toLowerCase() === 'a' &&
              anchorElement.href
                ? anchorElement.href
                : null,
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