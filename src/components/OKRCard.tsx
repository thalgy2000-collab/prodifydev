import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Objective, KeyResult, OKRCategory } from '@/types/okr';
import { Trash2, Target, Pencil, TreePine, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import EditOKRDialog from './EditOKRDialog';

interface Props {
  objective: Objective;
  progress: number;
  onUpdateKR: (objectiveId: string, krId: string, value: number) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; category?: OKRCategory; keyResults?: Omit<KeyResult, 'id'>[] }) => void;
  dragHandlers?: {
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    isDragging?: boolean;
    isDragOver?: boolean;
  };
}

const OKRCard = ({ objective, progress, onUpdateKR, onDelete, onEdit, dragHandlers }: Props) => {
  const [editOpen, setEditOpen] = useState(false);
  const [editingPct, setEditingPct] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handlePercentCommit = (kr: KeyResult, rawValue: string) => {
    const num = Number(rawValue);
    setEditingPct(prev => {
      const next = { ...prev };
      delete next[kr.id];
      return next;
    });
    if (rawValue.trim() === '' || isNaN(num)) return;
    const clampedPct = Math.max(0, Math.min(100, num));
    const newCurrent = kr.targetValue > 0 ? Math.round((clampedPct / 100) * kr.targetValue * 100) / 100 : clampedPct;
    if (newCurrent !== kr.currentValue) {
      onUpdateKR(objective.id, kr.id, newCurrent);
    }
  };

  return (
    <>
      <div
        data-tour-feature="okr-card"
        draggable={dragHandlers?.draggable}
        onDragStart={dragHandlers?.onDragStart}
        onDragOver={dragHandlers?.onDragOver}
        onDrop={dragHandlers?.onDrop}
        onDragEnd={dragHandlers?.onDragEnd}
        className={`group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
          dragHandlers?.isDragging ? 'opacity-50' : ''
        } ${dragHandlers?.isDragOver ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {dragHandlers?.draggable && (
              <button
                type="button"
                aria-label="Arrastar para reordenar"
                title="Arraste para reordenar"
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors -ml-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-5 w-5" />
              </button>
            )}
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
            const pct = kr.targetValue > 0 ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100)) : 0;
            const displayPct = editingPct[kr.id] !== undefined ? editingPct[kr.id] : String(pct);
            return (
              <div key={kr.id} data-tour-feature="okr-kr-progress" className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-foreground flex-1">{kr.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={displayPct}
                        aria-label={`Aproveitamento (%) de ${kr.title}`}
                        title="Aproveitamento manual (%)"
                        onChange={(e) => setEditingPct(prev => ({ ...prev, [kr.id]: e.target.value }))}
                        onBlur={(e) => handlePercentCommit(kr, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-7 w-16 pr-5 pl-2 text-right font-mono text-xs"
                      />
                      <span className="pointer-events-none absolute right-2 font-mono text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
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
