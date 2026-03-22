export type SprintStatus = 'planning' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
}

export const SPRINT_STATUS_CONFIG: Record<SprintStatus, { label: string; color: string }> = {
  planning: { label: 'Planejamento', color: '210 40% 60%' },
  active: { label: 'Ativa', color: '160 60% 45%' },
  completed: { label: 'Concluída', color: '0 0% 55%' },
};