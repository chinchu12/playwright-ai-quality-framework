import { FailureContext } from '../failure-context/failure-context';
import { HealingResult } from './healing-result';
import { getHealingSuggestionFromOllama } from '../providers/ollama-provider';

export async function suggestHealing(
  context: FailureContext
): Promise<HealingResult | null> {
  return await getHealingSuggestionFromOllama(context);
}