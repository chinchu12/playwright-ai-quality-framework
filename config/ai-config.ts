import 'dotenv/config';

export const aiConfig = {
  ollamaUrl:
    process.env.OLLAMA_URL ??
    'http://localhost:11434/api/generate',

  model:
    process.env.OLLAMA_MODEL ??
    'gemma3:4b',

  healingConfidenceThreshold:
    Number(process.env.HEALING_CONFIDENCE_THRESHOLD ?? 0.9),

  locatorTimeoutMs:
    Number(process.env.LOCATOR_TIMEOUT_MS ?? 3000),
};