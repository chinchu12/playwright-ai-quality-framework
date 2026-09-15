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

Your job is to identify the best replacement locator using ONLY the
interactiveElements supplied in the failure context.

Return valid JSON with exactly this structure:

{
  "originalLocator": "string",
  "strategy": "role",
  "role": "string",
  "name": "string",
  "confidence": 0.0,
  "reason": "string"
}

Rules:

1. Never invent an element or accessible name.
2. The replacement must come from interactiveElements.
3. Prefer ariaLabel over surrounding visible text when ariaLabel is present.
4. For input elements, the accessible name is usually ariaLabel or associated label text.
5. Do not reuse the failed accessible name unless it is actually present.
6. Match the failed semantic role whenever possible.
7. For:
   - input -> role "textbox"
   - button -> role "button"
   - anchor -> role "link"
8. Use confidence >= 0.90 only when the evidence is strong.
9. If no reliable candidate exists, return confidence below 0.90.
10. Return JSON only. No markdown.

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