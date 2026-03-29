export interface Release {
  id: string;
  name: string;
  version: string;
  plannedDate: string;
  status: 'planned' | 'in_progress' | 'released';
  createdAt: string;
}

export interface ReleaseItem {
  id: string;
  releaseId: string;
  roadmapItemId: string;
  createdAt: string;
}

export const RELEASE_STATUS_LABELS: Record<Release['status'], string> = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  released: 'Lançado',
};
