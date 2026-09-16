import { FailureContext } from '../failure-context/failure-context';
import {
  FailureCategory,
  FailureClassification,
} from './failure-classification';
import { aiConfig } from '../../config/ai-config';

interface OllamaResponse {
  response: string;
}

export async function classifyFailure(
  context: FailureContext
): Promise<FailureClassification | null> {
  if (!aiConfig.enabled) {
    console.log(
      '\nAI classification skipped because AI_HEALING_ENABLED=false.\n'
    );

    return null;
  }

  const prompt = `
You are a senior QA automation engineer.

Analyze the Playwright failure context below and classify the failure into
exactly one of these categories:

- AUTOMATION_DEFECT
- PRODUCT_DEFECT
- ENVIRONMENT_FAILURE
- TEST_DATA_FAILURE
- FLAKY_TEST
- UNKNOWN

Definitions:

AUTOMATION_DEFECT:
The test automation itself is incorrect, such as a broken locator,
incorrect assertion, incorrect test logic, or outdated automation code.

PRODUCT_DEFECT:
The application appears to behave incorrectly compared with the expected
behavior.

ENVIRONMENT_FAILURE:
The failure is caused by infrastructure, networking, service availability,
browser startup, deployment, or another environment-related problem.

TEST_DATA_FAILURE:
The failure is caused by missing, invalid, expired, inconsistent, or
incorrect test data.

FLAKY_TEST:
The evidence suggests an intermittent or timing-related failure that may
pass without an application or automation change.

UNKNOWN:
There is not enough evidence to confidently determine the root cause.

Important rules:

1. Use only the evidence supplied in the failure context.
2. Do not invent backend failures, environment problems, or test-data issues.
3. If a locator clearly failed but a matching interactive element exists
   under a different accessible name, prefer AUTOMATION_DEFECT.
4. A timeout alone does not automatically mean ENVIRONMENT_FAILURE.
5. If evidence is insufficient, classify as UNKNOWN.
6. confidence must be between 0 and 1.
7. Use confidence >= 0.90 only when the evidence strongly supports the category.
8. Return JSON only.
9. Do not include markdown.

Return exactly this structure:

{
  "category": "AUTOMATION_DEFECT",
  "confidence": 0.95,
  "reason": "Short explanation based only on the supplied evidence."
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
            category: {
              type: 'string',
              enum: [
                'AUTOMATION_DEFECT',
                'PRODUCT_DEFECT',
                'ENVIRONMENT_FAILURE',
                'TEST_DATA_FAILURE',
                'FLAKY_TEST',
                'UNKNOWN',
              ],
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
            'category',
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
      '\nAI classification unavailable: could not connect to Ollama.\n'
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
      `\nAI classification request failed: ${response.status} ${response.statusText}\n`
    );

    return null;
  }

  let data: OllamaResponse;

  try {
    data = (await response.json()) as OllamaResponse;
  } catch (error) {
    console.error(
      '\nAI classification failed: Ollama returned an invalid HTTP response body.\n'
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
      '\nAI classification failed: Ollama response did not contain generated content.\n'
    );

    return null;
  }

  try {
    const cleanedResponse = data.response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const classification = JSON.parse(
      cleanedResponse
    ) as FailureClassification;

    const validCategories: FailureCategory[] = [
      'AUTOMATION_DEFECT',
      'PRODUCT_DEFECT',
      'ENVIRONMENT_FAILURE',
      'TEST_DATA_FAILURE',
      'FLAKY_TEST',
      'UNKNOWN',
    ];

    if (
      !validCategories.includes(classification.category) ||
      typeof classification.confidence !== 'number' ||
      classification.confidence < 0 ||
      classification.confidence > 1 ||
      !classification.reason
    ) {
      console.error(
        '\nIncomplete failure classification:\n',
        classification
      );

      return null;
    }

    return classification;
  } catch (error) {
    console.error(
      '\nInvalid JSON returned by Ollama during failure classification:\n',
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