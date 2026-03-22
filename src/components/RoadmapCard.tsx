import { RoadmapItem } from '@/types/roadmap';
import { Objective } from '@/types/okr';
import { Trash2, ArrowRight, Circle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  item: RoadmapItem;
  objective?: Objective;
  onUpdateStatus: (id: string, status: RoadmapItem['status']) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  planned: { label: 'Planejado', icon: Circle, className: 'bg-secondary text-secondary-foreground' },
  in_progress: { label: 'Em andamento', icon: Loader2, className: 'bg-primary/10 text-primary' },
  done: { label: 'Concluído', icon: CheckCircle2, className: 'bg-success/10 text-success' },
};

const nextStatus: Record<RoadmapItem['status'], RoadmapItem['status']> = {
  planned: 'in_progress', in_progress: 'done', done: 'planned',
};

const RoadmapCard = ({ item, objective, onUpdateStatus, onDelete }: Props) => {
  const cfg = statusConfig[item.status];
  const Icon = cfg.icon;

  return (
    <div className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button onClick={() => onUpdateStatus(item.id, nextStatus[item.status])} className="mt-0.5 shrink-0 rounded-md p-1 transition-colors hover:bg-secondary">
            <Icon className={`h-5 w-5 ${item.status === 'in_progress' ? 'animate-spin text-primary' : item.status === 'done' ? 'text-success' : 'text-muted-foreground'}`} />
          </button>
          <div>
            <h3 className={`font-semibold leading-tight ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{item.title}</h3>
            {item.description && (<p className="mt-1 text-sm text-muted-foreground">{item.description}</p>)}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
              {objective && (<Badge variant="outline" className="gap-1 text-xs"><ArrowRight className="h-3 w-3" />{objective.title}</Badge>)}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default RoadmapCard;