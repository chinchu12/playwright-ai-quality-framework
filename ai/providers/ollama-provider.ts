import { FailureContext } from '../failure-context/failure-context';
import {
  HealingResult,
  HealingStrategy,
} from '../healing/healing-result';
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

Choose the best replacement locator using ONLY the supplied
interactiveElements.

Allowed locator strategies:

1. role
   Example:
   page.getByRole('button', { name: 'Submit' })

2. label
   Example:
   page.getByLabel('Email address')

3. placeholder
   Example:
   page.getByPlaceholder('Search catalogue')

4. testId
   Example:
   page.getByTestId('login-button')

5. css
   Example:
   page.locator('#product-search')

Strategy priority:

1. role
2. label
3. placeholder
4. testId
5. css

Prefer semantic Playwright locators over CSS.

For the "name" field:

- role:
  use the accessible name

- label:
  use associatedLabel

- placeholder:
  use placeholder

- testId:
  use data-testid

- css:
  use a CSS selector based on captured evidence such as id

For input elements:

- text, email, search, tel, url and password inputs normally use role "textbox"
- checkbox inputs use role "checkbox"
- radio inputs use role "radio"
- if ariaLabel exists and role strategy is appropriate, prefer ariaLabel
- associatedLabel is preferred for label strategy
- placeholder is preferred for placeholder strategy

ACTION COMPATIBILITY RULES:

- For action "fill":
  only choose input, textarea, select, textbox, or combobox elements.
  Never choose buttons or links.

- For action "click":
  prefer buttons, links, checkboxes, radio buttons, and other clickable elements.

- The replacement candidate must support the failed Playwright action.

- If action is "fill" and an input has ariaLabel, associatedLabel, or placeholder,
  choose that input instead of a nearby button with similar text.

Important rules:

1. Never invent an element.
2. Never invent locator evidence.
3. Use only values found in interactiveElements.
4. Do not reuse the failed locator unless evidence proves it is valid.
5. Prefer semantic strategies over CSS.
6. Use CSS only as a last resort.
7. For role strategy, "role" is mandatory and must contain the exact Playwright role.
8. Never return strategy "role" without a role value.
9. For non-role strategies, "role" may be omitted.
10. "name" must never be null or empty.
11. confidence must be between 0 and 1.
12. Use confidence >= 0.90 only when evidence strongly supports the locator.
13. If no reliable replacement exists, return confidence below 0.90.
14. Return JSON only.
15. Do not include markdown.

Examples:

ROLE:

{
  "originalLocator": "getByRole('link', { name: 'More details' })",
  "strategy": "role",
  "role": "link",
  "name": "Learn more",
  "confidence": 0.98,
  "reason": "The captured anchor element has visible text Learn more."
}

LABEL:

{
  "originalLocator": "getByRole('textbox', { name: 'Username' })",
  "strategy": "label",
  "name": "Email address",
  "confidence": 0.96,
  "reason": "The input is associated with the label Email address."
}

PLACEHOLDER:

{
  "originalLocator": "getByRole('textbox', { name: 'Search' })",
  "strategy": "placeholder",
  "name": "Search catalogue",
  "confidence": 0.94,
  "reason": "The input has the placeholder Search catalogue."
}

CSS:

{
  "originalLocator": "getByRole('textbox', { name: 'Search' })",
  "strategy": "css",
  "name": "#product-search",
  "confidence": 0.90,
  "reason": "No stronger semantic locator was available, but the captured id is product-search."
}

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
              enum: [
                'role',
                'label',
                'placeholder',
                'testId',
                'css',
              ],
            },

            role: {
              type: ['string', 'null'],
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
              minLength: 1,
            },
          },

          required: [
            'originalLocator',
            'strategy',
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

    const validStrategies: HealingStrategy[] = [
      'role',
      'label',
      'placeholder',
      'testId',
      'css',
    ];

    if (
      !healingResult.originalLocator ||
      !validStrategies.includes(healingResult.strategy) ||
      !healingResult.name ||
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

    if (
      healingResult.strategy === 'role' &&
      !healingResult.role
    ) {
      let matchingElement =
        context.interactiveElements.find((element) =>
          [
            element.ariaLabel,
            element.associatedLabel,
            element.text,
            element.placeholder,
          ].some(
            (value) =>
              value?.trim().toLowerCase() ===
              healingResult.name.trim().toLowerCase()
          )
        );

      // Deterministic fallback:
      // infer original Playwright role from the failed locator.
      if (!matchingElement && context.locator) {
        const roleMatch = context.locator.match(
          /getByRole\(['"]([^'"]+)['"]/
        );

        const originalRole = roleMatch?.[1];

        if (originalRole) {
          const compatibleElements =
            context.interactiveElements.filter((element) => {
              switch (originalRole) {
                case 'link':
                  return element.tag === 'a';

                case 'button':
                  return (
                    element.tag === 'button' ||
                    element.type === 'button' ||
                    element.type === 'submit'
                  );

                case 'textbox':
                  return (
                    element.tag === 'textarea' ||
                    (
                      element.tag === 'input' &&
                      ![
                        'checkbox',
                        'radio',
                        'button',
                        'submit',
                        'reset',
                      ].includes(element.type ?? '')
                    )
                  );

                case 'checkbox':
                  return (
                    element.tag === 'input' &&
                    element.type === 'checkbox'
                  );

                case 'radio':
                  return (
                    element.tag === 'input' &&
                    element.type === 'radio'
                  );

                case 'combobox':
                  return element.tag === 'select';

                default:
                  return element.role === originalRole;
              }
            });

          if (compatibleElements.length === 1) {
            matchingElement = compatibleElements[0];

            const fallbackName =
              matchingElement.ariaLabel ??
              matchingElement.associatedLabel ??
              matchingElement.text ??
              matchingElement.placeholder;

            if (fallbackName) {
              healingResult.name = fallbackName;

              console.log(
                `\nAI name replaced with deterministic DOM candidate "${fallbackName}".\n`
              );
            }
          }
        }
      }

      if (!matchingElement) {
        console.error(
          '\nHealing rejected: role strategy has no role and no reliable matching DOM element was found.\n'
        );

        return null;
      }

      // Action compatibility guardrail.
      if (context.action === 'fill') {
        const fillableTags = [
          'input',
          'textarea',
          'select',
        ];

        const isFillable =
          fillableTags.includes(matchingElement.tag) ||
          matchingElement.role === 'textbox' ||
          matchingElement.role === 'combobox';

        if (!isFillable) {
          console.error(
            `\nHealing rejected: "${healingResult.name}" is not compatible with action "fill".\n`
          );

          return null;
        }
      }

      switch (matchingElement.tag) {
        case 'a':
          healingResult.role = 'link';
          break;

        case 'button':
          healingResult.role = 'button';
          break;

        case 'textarea':
          healingResult.role = 'textbox';
          break;

        case 'select':
          healingResult.role = 'combobox';
          break;

        case 'input': {
          switch (matchingElement.type) {
            case 'checkbox':
              healingResult.role = 'checkbox';
              break;

            case 'radio':
              healingResult.role = 'radio';
              break;

            case 'button':
            case 'submit':
            case 'reset':
              healingResult.role = 'button';
              break;

            default:
              healingResult.role = 'textbox';
          }

          break;
        }

        default:
          if (matchingElement.role) {
            healingResult.role = matchingElement.role;
          }
      }

      if (!healingResult.role) {
        console.error(
          '\nHealing rejected: unable to infer Playwright role from DOM evidence.\n'
        );

        return null;
      }

      console.log(
        `\nRole "${healingResult.role}" inferred from DOM evidence.\n`
      );
    }

    const normalizedName =
      healingResult.name.trim().toLowerCase();

    let proposedValueExists = false;

    switch (healingResult.strategy) {
      case 'role':
        proposedValueExists =
          context.interactiveElements.some((element) =>
            [
              element.ariaLabel,
              element.associatedLabel,
              element.text,
              element.placeholder,
            ].some(
              (value) =>
                value?.trim().toLowerCase() ===
                normalizedName
            )
          );
        break;

      case 'label':
        proposedValueExists =
          context.interactiveElements.some(
            (element) =>
              element.associatedLabel
                ?.trim()
                .toLowerCase() === normalizedName
          );
        break;

      case 'placeholder':
        proposedValueExists =
          context.interactiveElements.some(
            (element) =>
              element.placeholder
                ?.trim()
                .toLowerCase() === normalizedName
          );
        break;

      case 'testId':
        proposedValueExists =
          context.interactiveElements.some(
            (element) =>
              element.testId
                ?.trim()
                .toLowerCase() === normalizedName
          );
        break;

      case 'css':
        proposedValueExists =
          context.interactiveElements.some((element) => {
            if (!element.id) {
              return false;
            }

            return (
              `#${element.id}`
                .trim()
                .toLowerCase() === normalizedName
            );
          });
        break;
    }

    if (!proposedValueExists) {
      console.error(
        `\nHealing rejected: AI proposed ${healingResult.strategy} value "${healingResult.name}" but it does not exist in captured DOM evidence.\n`
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