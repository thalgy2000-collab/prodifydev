import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, CalendarClock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRiceStore } from '@/hooks/useRiceStore';
import { mapAiImpact, mapAiConfidence, calcRiceScore } from '@/types/rice';
import { toast as sonnerToast } from 'sonner';

interface Props {
  taskId: string;
  taskTitle: string;
  itemType?: 'task' | 'initiative';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SuggestionRow {
  id: string;
  created_at: string;
  applied: boolean;
  applied_at: string | null;
  suggested_reach: number | null;
  suggested_impact: number | null;
  suggested_confidence: number | null;
  suggested_effort: number | null;
  suggested_score: number | null;
  reason_reach: string | null;
  reason_impact: string | null;
  reason_confidence: string | null;
  reason_effort: string | null;
  context_description: string | null;
  context_audience: string | null;
  context_impact_level: string | null;
  context_complexity: string | null;
  context_evidence: string | null;
  context_objective_id: string | null;
  objectives?: { title: string } | null;
}

export const RiceSuggestionsHistoryModal = ({ taskId, taskTitle, itemType = 'task', open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SuggestionRow[]>([]);
  const { setScore } = useRiceStore();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from('rice_ai_suggestions') as any)
        .select('*, objectives(title)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!cancelled) {
        setItems((data as SuggestionRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, taskId]);

  const handleApply = async (s: SuggestionRow) => {
    const reach = Number(s.suggested_reach) || 0;
    const impact = mapAiImpact(Number(s.suggested_impact) || 1);
    const confidence = mapAiConfidence(Number(s.suggested_confidence) || 50);
    const effort = Number(s.suggested_effort) || 1;
    await setScore(taskId, itemType, { reach, impact, confidence, effort, aiSuggested: true });
    await (supabase.from('rice_ai_suggestions') as any)
      .update({ applied: true, applied_at: new Date().toISOString() })
      .eq('id', s.id);
    setItems(prev => prev.map(p => p.id === s.id ? { ...p, applied: true, applied_at: new Date().toISOString() } : p));
    sonnerToast.success('Sugestão aplicada ✨');
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Histórico de sugestões IA
          </DialogTitle>
          <DialogDescription>Tarefa: {taskTitle}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma sugestão da IA registrada para esta tarefa ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(s => {
                const hasContext = s.context_audience || s.context_impact_level || s.context_complexity || s.objectives?.title || s.context_description || s.context_evidence;
                const hasReasons = s.reason_reach || s.reason_impact || s.reason_confidence || s.reason_effort;
                const score = s.suggested_score ?? (
                  s.suggested_reach && s.suggested_impact && s.suggested_confidence && s.suggested_effort
                    ? Number(calcRiceScore(
                        Number(s.suggested_reach),
                        mapAiImpact(Number(s.suggested_impact)),
                        mapAiConfidence(Number(s.suggested_confidence)),
                        Number(s.suggested_effort),
                      ).toFixed(1))
                    : null
                );
                return (
                  <div key={s.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {fmtDate(s.created_at)}
                      </span>
                      {s.applied ? (
                        <Badge variant="secondary" className="gap-1 text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" /> Aplicada
                        </Badge>
                      ) : (
                        <Badge variant="outline">Não aplicada</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Alcance:</span> <span className="font-mono font-semibold">{s.suggested_reach ?? '—'}</span></div>
                      <div><span className="text-muted-foreground">Impacto:</span> <span className="font-mono font-semibold">{s.suggested_impact ?? '—'}</span></div>
                      <div><span className="text-muted-foreground">Confiança:</span> <span className="font-mono font-semibold">{s.suggested_confidence ?? '—'}%</span></div>
                      <div><span className="text-muted-foreground">Esforço:</span> <span className="font-mono font-semibold">{s.suggested_effort ?? '—'}</span></div>
                      <div><span className="text-muted-foreground">Score:</span> <span className="font-mono font-semibold text-primary">{score ?? '—'}</span></div>
                    </div>

                    {hasContext && (
                      <div className="rounded-md border border-border bg-muted/30 p-2 text-xs space-y-1">
                        <p className="font-medium mb-1">📋 Contexto fornecido:</p>
                        {s.context_audience && <p><span className="text-muted-foreground">Público:</span> "{s.context_audience}"</p>}
                        {s.context_impact_level && <p><span className="text-muted-foreground">Impacto:</span> "{s.context_impact_level}"</p>}
                        {s.context_complexity && <p><span className="text-muted-foreground">Complexidade:</span> "{s.context_complexity}"</p>}
                        {s.objectives?.title && <p><span className="text-muted-foreground">Objetivo:</span> "{s.objectives.title}"</p>}
                        {s.context_description && <p><span className="text-muted-foreground">Descrição:</span> "{s.context_description}"</p>}
                        {s.context_evidence && <p><span className="text-muted-foreground">Evidências:</span> "{s.context_evidence}"</p>}
                      </div>
                    )}

                    {hasReasons && (
                      <div className="rounded-md border border-border bg-muted/30 p-2 text-xs space-y-1">
                        <p className="font-medium mb-1">💬 Justificativas da IA:</p>
                        {s.reason_reach && <p><span className="text-muted-foreground">Alcance:</span> {s.reason_reach}</p>}
                        {s.reason_impact && <p><span className="text-muted-foreground">Impacto:</span> {s.reason_impact}</p>}
                        {s.reason_confidence && <p><span className="text-muted-foreground">Confiança:</span> {s.reason_confidence}</p>}
                        {s.reason_effort && <p><span className="text-muted-foreground">Esforço:</span> {s.reason_effort}</p>}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button size="sm" className="gap-1" onClick={() => handleApply(s)}>
                        <Sparkles className="h-3.5 w-3.5" />
                        Aplicar esta sugestão
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RiceSuggestionsHistoryModal;
