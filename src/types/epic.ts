export interface Epic {
  id: string;
  productId: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

export const EPIC_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
];
