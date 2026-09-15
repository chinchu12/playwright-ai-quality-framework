import { Locator, Page, TestInfo } from '@playwright/test';
import { collectFailureContext } from '../ai/failure-context/failure-context-collector';
import { FailureContext } from '../ai/failure-context/failure-context';
import { suggestHealing } from '../ai/healing/healing-engine';
import { resolveHealingLocator } from '../ai/healing/locator-resolver';
import { writeHealingAudit } from '../ai/reporting/healing-audit';

export class BasePage {
  protected readonly page: Page;
  protected readonly testInfo?: TestInfo;

  constructor(page: Page, testInfo?: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  async click(locator: Locator): Promise<void> {
    await locator.click();
  }

  async safeClick(
    locator: Locator,
    locatorDescription: string,
    action = 'click'
  ): Promise<void> {
    try {
      await locator.click({ timeout: 3000 });
    } catch (error) {
      if (!this.testInfo) {
        throw error;
      }

      const context: FailureContext = await collectFailureContext(
        this.page,
        this.testInfo,
        error as Error,
        locatorDescription,
        action
      );

      console.log(
        '\nCaptured failure context:\n',
        JSON.stringify(context, null, 2)
      );

      const healingResult = await suggestHealing(context);

      if (!healingResult) {
        console.log('\nNo healing suggestion was returned.\n');
        throw error;
      }

      // Safety rule:
      // Reject a healing suggestion that returns
      // the same accessible name as the failed locator.
      if (
        context.locator &&
        context.locator.includes(`name: '${healingResult.name}'`)
      ) {
        console.log(
          '\nHealing rejected because AI returned the same broken locator.\n'
        );

        throw error;
      }

      console.log(
        '\nHealing suggestion:\n',
        JSON.stringify(healingResult, null, 2)
      );

      // Only retry high-confidence AI suggestions.
      if (healingResult.confidence < 0.9) {
        console.log(
          `\nHealing skipped because confidence ${healingResult.confidence} is below threshold 0.9.\n`
        );

        throw error;
      }

      const healedLocator = resolveHealingLocator(
        this.page,
        healingResult
      );

      console.log('\nHigh-confidence healing accepted. Retrying...\n');

      try {
        await healedLocator.click({ timeout: 3000 });

        writeHealingAudit(
          context,
          healingResult,
          true
        );

        console.log('\nSelf-healing succeeded.\n');
      } catch (healingError) {
        writeHealingAudit(
          context,
          healingResult,
          false
        );

        console.log('\nSelf-healing retry failed.\n');

        throw healingError;
      }
    }
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }
}