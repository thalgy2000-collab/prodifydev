import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Objective, KeyResult, OKRCategory } from '@/types/okr';
import { Trash2, Target, Pencil, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import EditOKRDialog from './EditOKRDialog';

interface Props {
  objective: Objective;
  progress: number;
  onUpdateKR: (objectiveId: string, krId: string, value: number) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; category?: OKRCategory; keyResults?: Omit<KeyResult, 'id'>[] }) => void;
}

const OKRCard = ({ objective, progress, onUpdateKR, onDelete, onEdit }: Props) => {
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <div data-tour-feature="okr-card" className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold leading-tight">{objective.title}</h3>
              <span className="text-xs text-muted-foreground">{objective.quarter}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${
              progress >= 70 ? 'bg-success/10 text-success' :
              progress >= 40 ? 'bg-warning/10 text-warning' :
              'bg-destructive/10 text-destructive'
            }`}>{progress}%</span>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-primary" onClick={() => navigate(`/oportunidades?objectiveId=${objective.id}`)}>
              <TreePine className="h-4 w-4" />
              <span className="text-xs">Oportunidades</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => onDelete(objective.id)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Colored separator line */}
        <div className="my-4 h-0.5 w-full rounded-full bg-primary/40" />

        {/* Key Results */}
        <div className="space-y-5">
          {objective.keyResults.map(kr => {
            const pct = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
            return (
              <div key={kr.id} data-tour-feature="okr-kr-progress" className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{kr.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                </div>
                <Slider
                  value={[kr.currentValue]}
                  max={kr.targetValue}
                  step={1}
                  onValueChange={([v]) => onUpdateKR(objective.id, kr.id, v)}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>
      </div>
      <EditOKRDialog objective={objective} open={editOpen} onOpenChange={setEditOpen} onSave={onEdit} />
    </>
  );
};

export default OKRCard;
