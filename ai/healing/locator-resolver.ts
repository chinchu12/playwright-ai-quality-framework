import { Locator, Page } from '@playwright/test';
import { HealingResult } from './healing-result';

export function resolveHealingLocator(
  page: Page,
  healingResult: HealingResult
): Locator {
  switch (healingResult.strategy) {
    case 'role': {
      if (!healingResult.role) {
        throw new Error(
          'Healing result is missing role for role strategy.'
        );
      }

      return page.getByRole(
        healingResult.role as Parameters<Page['getByRole']>[0],
        {
          name: healingResult.name,
        }
      );
    }

    case 'label':
      return page.getByLabel(healingResult.name);

    case 'placeholder':
      return page.getByPlaceholder(healingResult.name);

    case 'testId':
      return page.getByTestId(healingResult.name);

    case 'css':
      return page.locator(healingResult.name);

    default:
      throw new Error(
        `Unsupported healing strategy: ${healingResult.strategy}`
      );
  }
}