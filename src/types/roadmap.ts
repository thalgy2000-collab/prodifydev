import { OKRCategory } from './okr';

export interface RoadmapItemKR {
  keyResultId: string;
  krContribution: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  status: 'planned' | 'in_progress' | 'done';
  progress: number;
  category: OKRCategory;
  objectiveId?: string;
  /** @deprecated use linkedKRs instead */
  keyResultId?: string;
  /** @deprecated use linkedKRs instead */
  krContribution?: number;
  linkedKRs: RoadmapItemKR[];
  startMonth: number;
  endMonth: number;
  startDate?: string | null;
  endDate?: string | null;
  color: string;
  createdAt: string;
}

export const getQuarterFromDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month <= 3) return `Q1 ${year}`;
  if (month <= 6) return `Q2 ${year}`;
  if (month <= 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
};

/** Parse a YYYY-MM-DD date string as a local date (avoid TZ shifts) */
export const parseDateOnly = (s?: string | null): Date | null => {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

export const formatDateOnly = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ROADMAP_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6474dc', '#78716c',
];