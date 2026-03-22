export type SwotCategory = 'strength' | 'weakness' | 'opportunity' | 'threat';

export interface SwotItem {
  id: string;
  objectiveId: string | null;
  category: SwotCategory;
  content: string;
  createdAt: string;
}

export const SWOT_CONFIG: Record<SwotCategory, { label: string; color: string; icon: string }> = {
  strength: { label: 'Forças', color: '160 60% 45%', icon: '💪' },
  weakness: { label: 'Fraquezas', color: '0 70% 55%', icon: '⚠️' },
  opportunity: { label: 'Oportunidades', color: '235 70% 65%', icon: '🚀' },
  threat: { label: 'Ameaças', color: '30 90% 50%', icon: '🔥' },
};
