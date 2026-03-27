import { OKRCategory } from './okr';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  status: 'planned' | 'in_progress' | 'done';
  category: OKRCategory;
  objectiveId?: string;
  keyResultId?: string;
  krContribution?: number;
  startMonth: number;
  endMonth: number;
  color: string;
  createdAt: string;
}

export const ROADMAP_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6474dc', '#78716c',
];