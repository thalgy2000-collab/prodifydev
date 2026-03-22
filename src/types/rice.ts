export interface RiceScore {
  id: string;
  itemId: string;
  itemType: 'task' | 'initiative';
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
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