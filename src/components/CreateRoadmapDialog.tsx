import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { RoadmapItem } from '@/types/roadmap';
import { Objective, OKR_CATEGORIES, OKRCategory, getQuarterMonths } from '@/types/okr';

interface Props {
  quarter: string;
  objectives: Objective[];
  onAdd: (data: Omit<RoadmapItem, 'id' | 'createdAt'>) => void;
}

const CreateRoadmapDialog = ({ quarter, objectives, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RoadmapItem['status']>('planned');
  const [category, setCategory] = useState<OKRCategory>('professional');
  const [objectiveId, setObjectiveId] = useState<string>('');
  const [keyResultId, setKeyResultId] = useState<string>('');
  const [krContribution, setKrContribution] = useState<number>(1);
  const [startMonth, setStartMonth] = useState(0);
  const [endMonth, setEndMonth] = useState(0);

  const months = getQuarterMonths(quarter);
  const selectedObjective = objectives.find(o => o.id === objectiveId);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title, description, quarter, status, category,
      objectiveId: objectiveId && objectiveId !== 'none' ? objectiveId : undefined,
      keyResultId: keyResultId && keyResultId !== 'none' ? keyResultId : undefined,
      krContribution: keyResultId && keyResultId !== 'none' ? krContribution : undefined,
      startMonth, endMonth: Math.max(startMonth, endMonth),
    });
    setTitle(''); setDescription(''); setStatus('planned'); setCategory('professional');
    setObjectiveId(''); setKeyResultId(''); setKrContribution(1);
    setStartMonth(0); setEndMonth(0); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Nova Iniciativa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Nova Iniciativa — {quarter}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Título</Label><Input placeholder="Ex: Lançar MVP do produto" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Detalhes da iniciativa..." value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={(v) => setCategory(v as OKRCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OKR_CATEGORIES.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex-1 space-y-2"><Label>Status</Label><Select value={status} onValueChange={(v) => setStatus(v as RoadmapItem['status'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planejado</SelectItem><SelectItem value="in_progress">Em andamento</SelectItem><SelectItem value="done">Concluído</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2"><Label>Mês início</Label><Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex-1 space-y-2"><Label>Mês fim</Label><Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent></Select></div>
          </div>
          {objectives.length > 0 && (
            <>
              <div className="space-y-2"><Label>Vincular a OKR</Label><Select value={objectiveId} onValueChange={(v) => { setObjectiveId(v); setKeyResultId(''); }}><SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{objectives.map(o => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}</SelectContent></Select></div>
              {selectedObjective && selectedObjective.keyResults.length > 0 && (
                <div className="space-y-2"><Label>Vincular a Key Result</Label><Select value={keyResultId} onValueChange={setKeyResultId}><SelectTrigger><SelectValue placeholder="Selecione um KR" /></SelectTrigger><SelectContent><SelectItem value="none">Nenhum</SelectItem>{selectedObjective.keyResults.map(kr => (<SelectItem key={kr.id} value={kr.id}>{kr.title} ({kr.currentValue}/{kr.targetValue} {kr.unit})</SelectItem>))}</SelectContent></Select></div>
              )}
              {keyResultId && keyResultId !== 'none' && (
                <div className="space-y-2"><Label>Contribuição ao KR quando concluída</Label><Input type="number" min={1} value={krContribution} onChange={e => setKrContribution(Number(e.target.value))} placeholder="Ex: 1" /><p className="text-xs text-muted-foreground">Valor que será adicionado ao KR quando a iniciativa for concluída</p></div>
              )}
            </>
          )}
          <Button onClick={handleSubmit} className="w-full">Criar Iniciativa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapDialog;