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
      .evaluateAll((elements) => {
        const candidates = elements
          .map((element) => {
            const htmlElement = element as HTMLElement;
            const inputElement = element as HTMLInputElement;
            const anchorElement = element as HTMLAnchorElement;

            const id = element.getAttribute('id');

            let associatedLabel: string | null = null;

            if (id) {
              const label = document.querySelector(
                `label[for="${CSS.escape(id)}"]`
              );

              associatedLabel =
                label?.textContent?.trim() ?? null;
            }

            const text =
              htmlElement.innerText?.trim() ?? '';

            const ariaLabel =
              element.getAttribute('aria-label');

            const name =
              element.getAttribute('name');

            const role =
              element.getAttribute('role');

            const testId =
  element.getAttribute('data-testid');  

            const type =
              'type' in inputElement && inputElement.type
                ? inputElement.type
                : null;

            const placeholder =
              'placeholder' in inputElement &&
              inputElement.placeholder
                ? inputElement.placeholder
                : null;

            const href =
              element.tagName.toLowerCase() === 'a' &&
              anchorElement.href
                ? anchorElement.href
                : null;

            return {
              tag: element.tagName.toLowerCase(),
              role,
              text,
              ariaLabel,
              id,
              name,
              type,
              placeholder,
              associatedLabel,
              testId,
              href,
            };
          })
          .filter((element) => {
            const hasUsefulEvidence =
              Boolean(element.ariaLabel) ||
              Boolean(element.associatedLabel) ||
              Boolean(element.text) ||
              Boolean(element.placeholder) ||
              Boolean(element.name) ||
              Boolean(element.id);

            if (!hasUsefulEvidence) {
              return false;
            }

            const isInteractiveTag = [
              'a',
              'button',
              'input',
              'textarea',
              'select',
            ].includes(element.tag);

            const hasMeaningfulRole =
              element.role !== null &&
              element.role !== 'none' &&
              element.role !== 'presentation';

            return (
              isInteractiveTag ||
              hasMeaningfulRole
            );
          });

        const scoreCandidate = (
          element: InteractiveElement
        ): number => {
          let score = 0;

          if (element.ariaLabel) {
            score += 5;
          }

          if (element.associatedLabel) {
            score += 4;
          }

          if (element.placeholder) {
            score += 3;
          }

          if (element.text) {
            score += 3;
          }

          if (element.role) {
            score += 2;
          }

          if (element.name) {
            score += 2;
          }

          if (element.id) {
            score += 1;
          }

          if (
            element.tag === 'input' ||
            element.tag === 'textarea'
          ) {
            score += 2;
          }

          if (element.tag === 'button') {
            score += 1;
          }

          if (element.tag === 'a') {
            score += 1;
          }

          return score;
        };

        return candidates
          .sort(
            (a, b) =>
              scoreCandidate(b) -
              scoreCandidate(a)
          )
          .slice(0, 30);
      });

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