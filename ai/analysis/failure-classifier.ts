import { FailureContext } from '../failure-context/failure-context';
import { FailureClassification } from './failure-classification';

interface OllamaResponse {
  response: string;
}

export async function classifyFailure(
  context: FailureContext
): Promise<FailureClassification | null> {
  const prompt = `
You are a senior QA automation engineer.

Classify the following Playwright failure into exactly one category:

AUTOMATION_DEFECT
PRODUCT_DEFECT
ENVIRONMENT_FAILURE
TEST_DATA_FAILURE
FLAKY_TEST
UNKNOWN

Return only valid JSON in this exact format:

{
  "category": "AUTOMATION_DEFECT",
  "confidence": 0.0,
  "reason": "string"
}

Rules:
- confidence must be between 0 and 1
- use only evidence from the provided failure context
- if evidence is insufficient, return UNKNOWN
- do not invent backend failures, environment issues, or test-data issues unless evidence supports them
- if a locator is clearly broken while the target element still exists under a different accessible name, prefer AUTOMATION_DEFECT
- return JSON only

Failure context:

${JSON.stringify(context, null, 2)}
`;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma3:4b',
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama classification request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as OllamaResponse;

  try {
    const cleanedResponse = data.response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const result = JSON.parse(
      cleanedResponse
    ) as FailureClassification;

    if (
      !result.category ||
      typeof result.confidence !== 'number' ||
      !result.reason
    ) {
      console.error(
        '\nIncomplete failure classification:\n',
        result
      );

      return null;
    }

    return result;
  } catch {
    console.error(
      '\nInvalid classification JSON returned by Ollama:\n',
      data.response
    );

    return null;
  }
}