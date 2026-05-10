import { OKRCategory } from './okr';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'open' | 'ready' | 'in_progress' | 'done';

export interface BacklogTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: OKRCategory;
  initiativeId?: string;
  objectiveId?: string;
  keyResultId?: string;
  storyPoints?: number;
  sprintId?: string;
  returnedFromSprintId?: string;
  dueDate?: string;
  dueTime?: string;
  dueEndTime?: string;
  scheduleActivityId?: string;
  assigneeId?: string;
  epicId?: string;
  completionPercentage?: number;
  roadmapImpact?: number;
  sortOrder?: number;
  externalId?: string;
  externalUrl?: string;
  externalStatus?: string;
  syncProvider?: 'jira' | 'linear';
  createdAt: string;
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  critical: { label: 'Crítica', color: '0 72% 50%' },
  high: { label: 'Alta', color: '25 95% 53%' },
  medium: { label: 'Média', color: '45 100% 51%' },
  low: { label: 'Baixa', color: '210 40% 60%' },
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string }> = {
  open: { label: 'Aberta' },
  ready: { label: 'Pronta' },
  in_progress: { label: 'Em andamento' },
  done: { label: 'Concluída' },
};