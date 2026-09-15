export type FailureCategory =
  | 'AUTOMATION_DEFECT'
  | 'PRODUCT_DEFECT'
  | 'ENVIRONMENT_FAILURE'
  | 'TEST_DATA_FAILURE'
  | 'FLAKY_TEST'
  | 'UNKNOWN';

export interface FailureClassification {
  category: FailureCategory;
  confidence: number;
  reason: string;
}