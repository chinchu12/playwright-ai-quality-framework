import fs from 'fs';
import path from 'path';
import { HealingResult } from '../healing/healing-result';
import { FailureContext } from '../failure-context/failure-context';

export interface HealingAuditEntry {
  testName: string;
  timestamp: string;
  originalLocator: string;
  healedLocator: {
    strategy: string;
    role: string;
    name: string;
  };
  confidence: number;
  reason: string;
  success: boolean;
}

export function writeHealingAudit(
  context: FailureContext,
  healingResult: HealingResult,
  success: boolean
): void {
  const reportDir = path.join(process.cwd(), 'test-results', 'healing-audit');
  const reportFile = path.join(reportDir, 'healing-events.json');

  fs.mkdirSync(reportDir, { recursive: true });

  let existingEntries: HealingAuditEntry[] = [];

  if (fs.existsSync(reportFile)) {
    const existingContent = fs.readFileSync(reportFile, 'utf-8');

    if (existingContent.trim()) {
      existingEntries = JSON.parse(existingContent);
    }
  }

  const entry: HealingAuditEntry = {
    testName: context.testName,
    timestamp: context.timestamp,
    originalLocator: healingResult.originalLocator,
    healedLocator: {
      strategy: healingResult.strategy,
      role: healingResult.role,
      name: healingResult.name,
    },
    confidence: healingResult.confidence,
    reason: healingResult.reason,
    success,
  };

  existingEntries.push(entry);

  fs.writeFileSync(
    reportFile,
    JSON.stringify(existingEntries, null, 2),
    'utf-8'
  );
}