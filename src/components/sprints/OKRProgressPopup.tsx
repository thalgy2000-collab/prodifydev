import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface KRProgress {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  objective_id: string;
  objectives: {
    title: string;
    quarter: string;
  };
}

interface OKRProgressPopupProps {
  kr: KRProgress | null;
  onClose: () => void;
}

export const OKRProgressPopup = ({ kr, onClose }: OKRProgressPopupProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!kr) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [kr, onClose]);

  if (!kr) return null;

  const progressPercentage = Math.min(100, Math.max(0, (kr.current_value / kr.target_value) * 100));
  const isCompleted = kr.current_value >= kr.target_value;

  const handleGoToOKRs = () => {
    navigate(`/okrs?quarter=${kr.objectives.quarter}&highlight=${kr.objective_id}`);
    onClose();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-5 w-[340px] relative overflow-hidden flex flex-col gap-3">
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
            {isCompleted ? <Trophy className="h-6 w-6" /> : <Target className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {isCompleted ? 'Key Result concluído!' : 'Você avançou em um Key Result!'}
            </h3>
            {isCompleted ? (
              <p className="text-xs text-muted-foreground mt-1" title={kr.title}>
                "{kr.title}" atingiu a meta: {kr.target_value}/{kr.target_value} {kr.unit}
              </p>
            ) : (
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <p className="line-clamp-1" title={kr.objectives.title}>
                  <span className="font-semibold">Objetivo:</span> {kr.objectives.title}
                </p>
                <p className="line-clamp-1" title={kr.title}>
                  <span className="font-semibold">KR:</span> {kr.title}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", isCompleted ? "bg-amber-500" : "bg-primary")}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-semibold whitespace-nowrap text-right">
            {kr.current_value}/{kr.target_value} {kr.unit}
          </span>
        </div>

        <div className="mt-1 flex justify-end">
          <Button onClick={handleGoToOKRs} size="sm" className="w-full text-xs h-8">
            Ver OKRs →
          </Button>
        </div>
      </div>
    </div>
  );
};
