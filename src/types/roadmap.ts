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
  createdAt: string;
}