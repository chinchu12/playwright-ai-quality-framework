import { FailureContext } from '../failure-context/failure-context';
import { HealingResult } from '../healing/healing-result';
import { aiConfig } from '../../config/ai-config';

interface OllamaResponse {
  response: string;
}

export async function getHealingSuggestionFromOllama(
  context: FailureContext
): Promise<HealingResult | null> {
  const prompt = `
You are a senior Playwright QA automation engineer.

A Playwright locator failed.

Your job is to identify a likely replacement locator using ONLY the evidence
available in the failure context.

Return valid JSON with exactly this structure:

{
  "originalLocator": "string",
  "strategy": "role",
  "role": "string",
  "name": "string",
  "confidence": 0.0,
  "reason": "string"
}

Important rules:

1. The failed locator did NOT work.
2. Do NOT return the same accessible name unless that exact name is visibly present.
3. Look at "visibleText" for likely replacement labels.
4. The proposed "name" should normally be exact visible text from the page.
5. Prefer the closest semantic match to the failed locator.
6. confidence must be between 0 and 1.
7. Use confidence >= 0.90 only when the evidence strongly supports the replacement.
8. If evidence is weak, return confidence below 0.90.
9. Do not include markdown.
10. Return JSON only.

Failure context:

${JSON.stringify(context, null, 2)}
`;

  const response = await fetch(aiConfig.ollamaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    model: aiConfig.model,
      prompt,
      stream: false,

      // Ask Ollama to enforce JSON output
      format: 'json',

      options: {
        temperature: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OllamaResponse;

  try {
    // Extra protection if a model still adds markdown fences.
    const cleanedResponse = data.response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const healingResult = JSON.parse(cleanedResponse) as HealingResult;

    // Safety check: do not accept an empty result.
    if (
      !healingResult.name ||
      !healingResult.role ||
      typeof healingResult.confidence !== 'number'
    ) {
      console.error('\nIncomplete healing response:\n', healingResult);
      return null;
    }

    return healingResult;
  } catch {
    console.error('\nInvalid JSON returned by Ollama:\n', data.response);
    return null;
  }
}