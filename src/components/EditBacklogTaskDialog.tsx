import { useState, useEffect, useCallback } from 'react';
import { BacklogTask, TaskPriority, PRIORITY_CONFIG } from '@/types/backlog';
import { RoadmapItem } from '@/types/roadmap';
import { useAcceptanceCriteriaStore } from '@/hooks/useAcceptanceCriteriaStore';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScheduleStore } from '@/hooks/useScheduleStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AcceptanceCriteriaSection from '@/components/AcceptanceCriteriaSection';

interface MemberOption {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface SprintOption {
  id: string;
  name: string;
  status: string;
}

interface EditBacklogTaskDialogProps {
  task: BacklogTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: Partial<BacklogTask>) => void;
  initiatives: RoadmapItem[];
}

const EditBacklogTaskDialog = ({ task, open, onOpenChange, onSave, initiatives }: EditBacklogTaskDialogProps) => {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const { addActivity, updateActivity, deleteActivity } = useScheduleStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [initiativeId, setInitiativeId] = useState<string>('none');
  const [storyPoints, setStoryPoints] = useState<number>(1);
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [dueEndTime, setDueEndTime] = useState<string>('');
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [sprintOptions, setSprintOptions] = useState<SprintOption[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('none');

  const { criteria, fetchByTask, addCriterion, updateCriterion, deleteCriterion, getCriteriaForTask } = useAcceptanceCriteriaStore();

  const fetchMembers = useCallback(async () => {
    if (!activeProduct) return;
    const { data: membersData } = await (supabase.from('product_members') as any)
      .select('user_id, role')
      .eq('product_id', activeProduct.id);
    if (!membersData || membersData.length === 0) { setMemberOptions([]); return; }
    const userIds = membersData.map((m: any) => m.user_id);
    const { data: profilesData } = await (supabase.from('profiles') as any)
      .select('id, display_name, full_name, email, avatar_url')
      .in('id', userIds);
    const profilesMap: Record<string, any> = {};
    (profilesData || []).forEach((p: any) => { profilesMap[p.id] = p; });
    setMemberOptions(membersData.map((m: any) => {
      const p = profilesMap[m.user_id];
      return {
        userId: m.user_id,
        displayName: p?.display_name || p?.full_name || p?.email || 'Sem nome',
        avatarUrl: p?.avatar_url || null,
      };
    }));
  }, [activeProduct]);

  const fetchSprints = useCallback(async () => {
    if (!activeProduct) { setSprintOptions([]); return; }
    const { data } = await (supabase.from('sprints') as any)
      .select('id, name, status')
      .eq('product_id', activeProduct.id)
      .neq('status', 'completed')
      .order('created_at', { ascending: false });
    setSprintOptions(data || []);
  }, [activeProduct]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchSprints();
    }
  }, [open, fetchMembers, fetchSprints]);

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDescription(task.description || '');
      setPriority(task.priority);
      setInitiativeId(task.initiativeId || 'none'); setStoryPoints(task.storyPoints || 1);
      setAssigneeId(task.assigneeId || 'none');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setDueEndTime(task.dueEndTime || '');
      setSelectedSprintId('none');
      fetchByTask(task.id);
    }
  }, [task, fetchByTask]);

  const taskCriteria = task ? getCriteriaForTask(task.id) : [];

  const handleAddToSprint = async () => {
    if (!task || selectedSprintId === 'none') return;
    await (supabase.from('backlog_tasks') as any)
      .update({ sprint_id: selectedSprintId })
      .eq('id', task.id);
    toast.success('Tarefa adicionada à sprint!');
    onOpenChange(false);
  };

  const handleRemoveFromSprint = async () => {
    if (!task) return;
    await (supabase.from('backlog_tasks') as any)
      .update({ sprint_id: null })
      .eq('id', task.id);
    toast.success('Tarefa removida da sprint!');
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    const initiative = initiatives.find(i => i.id === initiativeId);
    const patch: Partial<BacklogTask> = {
      title, description, priority,
      initiativeId: initiativeId !== 'none' ? initiativeId : undefined,
      objectiveId: initiative?.objectiveId, keyResultId: initiative?.keyResultId, storyPoints,
      assigneeId: assigneeId !== 'none' ? assigneeId : undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      dueEndTime: dueEndTime || undefined,
    };

    // Handle schedule activity
    if (dueDate) {
      if (task.scheduleActivityId) {
        await updateActivity(task.scheduleActivityId, {
          title: `[${title}]`,
          description: description || '',
          activityDate: dueDate,
          startTime: dueTime || undefined,
          endTime: dueEndTime || undefined,
        });
      } else {
        const newActivity = await addActivity({
          title: `[${title}]`,
          description: description || '',
          activityDate: dueDate,
          startTime: dueTime || undefined,
          endTime: dueEndTime || undefined,
          status: 'pending',
        });
        patch.scheduleActivityId = newActivity.id;
      }
    } else if (task.scheduleActivityId) {
      await deleteActivity(task.scheduleActivityId);
      patch.scheduleActivityId = undefined;
    }

    onSave(task.id, patch);
    onOpenChange(false);
  };

          {/* Acceptance Criteria Section */}
          {task && (
            <AcceptanceCriteriaSection
              taskId={task.id}
              criteria={taskCriteria}
              addCriterion={addCriterion}
              updateCriterion={updateCriterion}
              deleteCriterion={deleteCriterion}
            />
          )}

          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBacklogTaskDialog;
