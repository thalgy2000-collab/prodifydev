import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface InitiativeProgress {
  id: string;
  title: string;
  progress: number;
  quarter: string;
}

interface RoadmapProgressPopupProps {
  initiative: InitiativeProgress | null;
  onClose: () => void;
}

export const RoadmapProgressPopup = ({ initiative, onClose }: RoadmapProgressPopupProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!initiative) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [initiative, onClose]);

  if (!initiative) return null;

  const isCompleted = initiative.progress >= 100;

  const handleGoToRoadmap = () => {
    navigate(`/roadmap?quarter=${initiative.quarter}&highlight=${initiative.id}`);
    onClose();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-5 w-80 relative overflow-hidden flex flex-col gap-3">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isCompleted ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"
          )}>
            {isCompleted ? <Trophy className="h-6 w-6" /> : <PartyPopper className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {isCompleted ? 'Iniciativa concluída!' : 'Você avançou em uma iniciativa!'}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={initiative.title}>
              "{initiative.title}" {isCompleted && 'chegou a 100% de progresso'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", isCompleted ? "bg-amber-500" : "bg-primary")}
              style={{ width: `${Math.min(100, Math.max(0, initiative.progress))}%` }}
            />
          </div>
          <span className="text-xs font-semibold w-8 text-right">
            {Math.round(initiative.progress)}%
          </span>
        </div>

        <div className="mt-1 flex justify-end">
          <Button onClick={handleGoToRoadmap} size="sm" className="w-full text-xs h-8">
            Ver Roadmap →
          </Button>
        </div>
      </div>
    </div>
  );
};
