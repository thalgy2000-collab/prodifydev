import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoadmapItem } from '@/types/roadmap';
import { Objective, OKR_CATEGORIES, OKRCategory, getQuarterMonths } from '@/types/okr';

interface Props {
  item: RoadmapItem;
  objectives: Objective[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: RoadmapItem) => void;
}

const EditRoadmapDialog = ({ item, objectives, open, onOpenChange, onSave }: Props) => {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [status, setStatus] = useState<RoadmapItem['status']>(item.status);
  const [category, setCategory] = useState<OKRCategory>(item.category);
  const [objectiveId, setObjectiveId] = useState(item.objectiveId || '');
  const [keyResultId, setKeyResultId] = useState(item.keyResultId || '');
  const [krContribution, setKrContribution] = useState(item.krContribution || 1);
  const [startMonth, setStartMonth] = useState(item.startMonth);
  const [endMonth, setEndMonth] = useState(item.endMonth);

  const months = getQuarterMonths(item.quarter);
  const selectedObjective = objectives.find(o => o.id === objectiveId);

  useEffect(() => {
    setTitle(item.title); setDescription(item.description); setStatus(item.status);
    setCategory(item.category); setObjectiveId(item.objectiveId || '');
    setKeyResultId(item.keyResultId || ''); setKrContribution(item.krContribution || 1);
    setStartMonth(item.startMonth); setEndMonth(item.endMonth);
  }, [item]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      ...item, title, description, status, category,
      objectiveId: objectiveId && objectiveId !== 'none' ? objectiveId : undefined,
      keyResultId: keyResultId && keyResultId !== 'none' ? keyResultId : undefined,
      krContribution: keyResultId && keyResultId !== 'none' ? krContribution : undefined,
      startMonth, endMonth: Math.max(startMonth, endMonth),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Editar Iniciativa</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(v) => setStatus(v as RoadmapItem['status'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planejado</SelectItem><SelectItem value="in_progress">Em andamento</SelectItem><SelectItem value="done">Concluído</SelectItem></SelectContent></Select></div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2"><Label>Mês início</Label><Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex-1 space-y-2"><Label>Mês fim</Label><Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent></Select></div>
          </div>
          {objectives.length > 0 && (
            <>
              <div className="space-y-2"><Label>Vincular a OKR</Label><Select value={objectiveId || 'none'} onValueChange={(v) => { setObjectiveId(v); setKeyResultId(''); }}><SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{objectives.map(o => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}</SelectContent></Select></div>
              {selectedObjective && selectedObjective.keyResults.length > 0 && (
                <div className="space-y-2"><Label>Vincular a Key Result</Label><Select value={keyResultId || 'none'} onValueChange={setKeyResultId}><SelectTrigger><SelectValue placeholder="Selecione um KR" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{selectedObjective.keyResults.map(kr => (<SelectItem key={kr.id} value={kr.id}>{kr.title} ({kr.currentValue}/{kr.targetValue} {kr.unit})</SelectItem>))}</SelectContent></Select></div>
              )}
              {keyResultId && keyResultId !== 'none' && (
                <div className="space-y-2"><Label>Contribuição ao KR quando concluída</Label><Input type="number" min={1} value={krContribution} onChange={e => setKrContribution(Number(e.target.value))} /></div>
              )}
            </>
          )}
          <Button onClick={handleSubmit} className="w-full">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoadmapDialog;