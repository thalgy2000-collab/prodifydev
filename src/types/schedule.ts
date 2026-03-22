export type ActivityStatus = 'pending' | 'done';

export interface ScheduleActivity {
  id: string;
  title: string;
  description: string;
  activityDate: string;
  startTime?: string;
  endTime?: string;
  sprintId?: string;
  status: ActivityStatus;
  createdAt: string;
}

export const ACTIVITY_STATUS_CONFIG: Record<ActivityStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: '45 100% 51%' },
  done: { label: 'Concluída', color: '160 60% 45%' },
};