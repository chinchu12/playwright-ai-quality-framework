import { FailureContext } from '../failure-context/failure-context';
import { HealingResult } from '../healing/healing-result';
import { aiConfig } from '../../config/ai-config';

interface OllamaResponse {
  response: string;
}

export async function getHealingSuggestionFromOllama(
  context: FailureContext
): Promise<HealingResult | null> {

  if (!aiConfig.enabled) {
    console.log(
      '\nAI healing skipped because AI_HEALING_ENABLED=false.\n'
    );

    return null;
  }
  const prompt = `
You are a senior Playwright QA automation engineer.

A Playwright locator failed.

Choose the best replacement element using ONLY the supplied
interactiveElements.

IMPORTANT:
You must return a usable Playwright role locator.

For the "name" field use this priority:

1. ariaLabel
2. associatedLabel
3. visible text
4. placeholder

For input elements:
- use role "textbox" when type is text, email, search, tel, url, or password
- if ariaLabel exists, use the ariaLabel as the locator name
- do not return null for name

Example:

Interactive element:

{
  "tag": "input",
  "ariaLabel": "Product search",
  "associatedLabel": "Find a product",
  "placeholder": "Search catalogue"
}

Correct result:

{
  "strategy": "role",
  "role": "textbox",
  "name": "Product search"
}

Rules:

1. Never invent an element.
2. Never invent an accessible name.
3. Never return null or an empty string for "name".
4. The proposed name must exist in interactiveElements.
5. Prefer ariaLabel whenever it is available.
6. Do not reuse the failed accessible name unless it exists in the DOM evidence.
7. Match the semantic role of the failed action whenever possible.
8. input -> textbox
9. button -> button
10. anchor -> link
11. confidence must be between 0 and 1.
12. Use confidence >= 0.90 only when the DOM evidence strongly supports the candidate.
13. Return JSON only.
14. Do not include markdown.

Failure context:

${JSON.stringify(context, null, 2)}
`;

  let response: Response;

  try {
    response = await fetch(aiConfig.ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        model: aiConfig.model,
        prompt,
        stream: false,

        format: {
          type: 'object',

          properties: {
            originalLocator: {
              type: 'string',
            },

            strategy: {
              type: 'string',
              enum: ['role'],
            },

            role: {
              type: 'string',
            },

            name: {
              type: 'string',
              minLength: 1,
            },

            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
            },

            reason: {
              type: 'string',
            },
          },

          required: [
            'originalLocator',
            'strategy',
            'role',
            'name',
            'confidence',
            'reason',
          ],

          additionalProperties: false,
        },

        options: {
          temperature: 0,
        },
      }),
    });
  } catch (error) {
    console.error(
      '\nAI healing unavailable: could not connect to Ollama.\n'
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }

  if (!response.ok) {
    console.error(
      `\nAI healing request failed: ${response.status} ${response.statusText}\n`
    );

    return null;
  }

  let data: OllamaResponse;

  try {
    data = (await response.json()) as OllamaResponse;
  } catch (error) {
    console.error(
      '\nAI healing failed: Ollama returned an invalid HTTP response body.\n'
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }

  if (!data.response) {
    console.error(
      '\nAI healing failed: Ollama response did not contain generated content.\n'
    );

    return null;
  }

  try {
    const cleanedResponse = data.response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const healingResult = JSON.parse(
      cleanedResponse
    ) as HealingResult;

    if (
      !healingResult.originalLocator ||
      healingResult.strategy !== 'role' ||
      !healingResult.name ||
      !healingResult.role ||
      typeof healingResult.confidence !== 'number' ||
      healingResult.confidence < 0 ||
      healingResult.confidence > 1 ||
      !healingResult.reason
    ) {
      console.error(
        '\nIncomplete healing response:\n',
        healingResult
      );

      return null;
    }

    const validNames = context.interactiveElements
      .flatMap((element) => [
        element.ariaLabel,
        element.associatedLabel,
        element.text,
        element.placeholder,
      ])
      .filter(
        (value): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0
      );

    const proposedNameExists = validNames.some(
      (name) =>
        name.trim().toLowerCase() ===
        healingResult.name.trim().toLowerCase()
    );

    if (!proposedNameExists) {
      console.error(
        `\nHealing rejected: AI proposed name "${healingResult.name}" but it does not exist in captured DOM evidence.\n`
      );

      return null;
    }

    return healingResult;
  } catch (error) {
    console.error(
      '\nInvalid JSON returned by Ollama during healing:\n',
      data.response
    );

    console.error(
      error instanceof Error
        ? error.message
        : error
    );

    return null;
  }
}