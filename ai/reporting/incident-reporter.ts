import fs from 'fs';
import path from 'path';
import { FailureContext } from '../failure-context/failure-context';
import { FailureClassification } from '../analysis/failure-classification';
import { HealingResult } from '../healing/healing-result';

export function writeIncidentReport(
  context: FailureContext,
  classification: FailureClassification,
  healingResult: HealingResult,
  success: boolean
): void {
  const reportDir = path.join(
    process.cwd(),
    'test-results',
    'incident-reports'
  );

  fs.mkdirSync(reportDir, { recursive: true });

  const safeTestName = context.testName
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();

  const reportFile = path.join(
    reportDir,
    `${safeTestName}-${Date.now()}.md`
  );

  const report = `# AI QA Incident Report

## Test

${context.testName}

## URL

${context.url}

## Failure Classification

**Category:** ${classification.category}

**Confidence:** ${(classification.confidence * 100).toFixed(0)}%

**Reason:** ${classification.reason}

## Failed Action

**Action:** ${context.action ?? 'unknown'}

**Original Locator:**

\`${healingResult.originalLocator}\`

## AI Healing Suggestion

**Strategy:** ${healingResult.strategy}

**Role:** ${healingResult.role}

**Name:** ${healingResult.name}

**Confidence:** ${(healingResult.confidence * 100).toFixed(0)}%

**Reason:** ${healingResult.reason}

## Healing Result

**Status:** ${success ? 'SUCCESS' : 'FAILED'}

## Evidence

**Page Title:** ${context.pageTitle}

**Screenshot:** ${context.screenshotPath ?? 'Not available'}

**Timestamp:** ${context.timestamp}

## Recommended Action

${
  classification.category === 'AUTOMATION_DEFECT'
    ? 'Review and update the Page Object locator. Confirm that the healed locator is stable before permanently changing the test.'
    : 'Review the failure evidence and investigate the classified issue before modifying the automation.'
}
`;

  fs.writeFileSync(
    reportFile,
    report,
    'utf-8'
  );

  console.log(`\nAI incident report created: ${reportFile}\n`);
}