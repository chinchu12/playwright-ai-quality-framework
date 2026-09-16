export type HealingStrategy =
  | 'role'
  | 'label'
  | 'placeholder'
  | 'testId'
  | 'css';

export interface HealingResult {
  originalLocator: string;
  strategy: HealingStrategy;
  role?: string;
  name: string;
  confidence: number;
  reason: string;
}