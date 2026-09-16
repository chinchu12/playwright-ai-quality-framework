import fs from 'fs';
import path from 'path';
import { HealingResult } from '../healing/healing-result';
import { FailureContext } from '../failure-context/failure-context';
import { FailureClassification } from '../analysis/failure-classification';

export interface HealingAuditEntry {
  testName: string;
  timestamp: string;

  classification: {
    category: string;
    confidence: number;
    reason: string;
  };

  originalLocator: string;

  healedLocator: {
    strategy: string;
    role?: string;
    name: string;
  };

  healingConfidence: number;
  healingReason: string;

  success: boolean;
}

export function writeHealingAudit(
  context: FailureContext,
  classification: FailureClassification,
  healingResult: HealingResult,
  success: boolean
): void {
  const reportDir = path.join(
    process.cwd(),
    'test-results',
    'healing-audit'
  );

  const reportFile = path.join(
    reportDir,
    'healing-events.json'
  );

  fs.mkdirSync(reportDir, { recursive: true });

  let existingEntries: HealingAuditEntry[] = [];

  if (fs.existsSync(reportFile)) {
    const existingContent = fs.readFileSync(
      reportFile,
      'utf-8'
    );

    if (existingContent.trim()) {
      existingEntries = JSON.parse(existingContent);
    }
  }

  const entry: HealingAuditEntry = {
    testName: context.testName,
    timestamp: context.timestamp,

    classification: {
      category: classification.category,
      confidence: classification.confidence,
      reason: classification.reason,
    },

    originalLocator: healingResult.originalLocator,

    healedLocator: {
      strategy: healingResult.strategy,
      role: healingResult.role,
      name: healingResult.name,
    },

    healingConfidence: healingResult.confidence,
    healingReason: healingResult.reason,

    success,
  };

  existingEntries.push(entry);

  fs.writeFileSync(
    reportFile,
    JSON.stringify(existingEntries, null, 2),
    'utf-8'
  );
}