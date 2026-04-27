export interface RiceScore {
  id: string;
  itemId: string;
  itemType: 'task' | 'initiative';
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  aiSuggested?: boolean;
}

export const IMPACT_OPTIONS = [
  { value: 0.25, label: 'Mínimo (0.25x)' },
  { value: 0.5, label: 'Baixo (0.5x)' },
  { value: 1, label: 'Médio (1x)' },
  { value: 2, label: 'Alto (2x)' },
  { value: 3, label: 'Massivo (3x)' },
];

export const CONFIDENCE_OPTIONS = [
  { value: 0.5, label: '50%' },
  { value: 0.8, label: '80%' },
  { value: 1, label: '100%' },
];

export const calcRiceScore = (r: number, i: number, c: number, e: number) =>
  e > 0 ? (r * i * c) / e : 0;

// Map AI impact (1..3) to internal scale (0.25, 0.5, 1, 2, 3)
export const mapAiImpact = (n: number): number => {
  if (n <= 1) return 1;
  if (n <= 2) return 2;
  return 3;
};

// Map AI confidence (0..100) to internal scale (0.5, 0.8, 1)
export const mapAiConfidence = (pct: number): number => {
  if (pct >= 90) return 1;
  if (pct >= 65) return 0.8;
  return 0.5;
};
