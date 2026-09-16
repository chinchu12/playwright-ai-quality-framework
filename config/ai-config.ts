import 'dotenv/config';

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.trim().toLowerCase() === 'true';
}

export const aiConfig = {
  enabled: parseBoolean(
    process.env.AI_HEALING_ENABLED,
    true
  ),

  ollamaUrl:
    process.env.OLLAMA_URL ??
    'http://localhost:11434/api/generate',

  model:
    process.env.OLLAMA_MODEL ??
    'gemma3:4b',

  healingConfidenceThreshold:
    Number(
      process.env.HEALING_CONFIDENCE_THRESHOLD ?? 0.9
    ),

  locatorTimeoutMs:
    Number(
      process.env.LOCATOR_TIMEOUT_MS ?? 3000
    ),
};