export interface HealingResult {
  originalLocator: string;
  strategy: 'role';
  role: string;
  name: string;
  confidence: number;
  reason: string;
}