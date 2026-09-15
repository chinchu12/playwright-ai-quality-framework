import { Locator, Page } from '@playwright/test';
import { HealingResult } from './healing-result';

export function resolveHealingLocator(
  page: Page,
  healingResult: HealingResult
): Locator {
  if (healingResult.strategy === 'role') {
    return page.getByRole(
      healingResult.role as Parameters<Page['getByRole']>[0],
      {
        name: healingResult.name,
      }
    );
  }

  throw new Error(
    `Unsupported healing strategy: ${healingResult.strategy}`
  );
}