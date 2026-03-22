export type OpportunityNodeType = 'outcome' | 'opportunity' | 'solution' | 'experiment';

export interface OpportunityNode {
  id: string;
  objectiveId: string;
  parentId: string | null;
  type: OpportunityNodeType;
  title: string;
  description: string;
  createdAt: string;
}

export const NODE_TYPE_CONFIG: Record<OpportunityNodeType, { label: string; color: string; icon: string }> = {
  outcome: { label: 'Resultado', color: '235 70% 65%', icon: '🎯' },
  opportunity: { label: 'Oportunidade', color: '160 60% 45%', icon: '💡' },
  solution: { label: 'Solução', color: '45 100% 55%', icon: '🔧' },
  experiment: { label: 'Experimento', color: '330 60% 75%', icon: '🧪' },
};