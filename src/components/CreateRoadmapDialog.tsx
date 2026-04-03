import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { RoadmapItem, RoadmapItemKR, ROADMAP_COLORS } from '@/types/roadmap';
import { Objective, OKRCategory, getQuarterMonths } from '@/types/okr';

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
  const [linkedKRs, setLinkedKRs] = useState<RoadmapItemKR[]>([]);
  const [startMonth, setStartMonth] = useState(0);
  const [endMonth, setEndMonth] = useState(0);
  const [color, setColor] = useState(ROADMAP_COLORS[0]);

  const months = getQuarterMonths(quarter);
  const selectedObjective = objectives.find(o => o.id === objectiveId);

  const toggleKR = (krId: string) => {
    setLinkedKRs(prev => {
      const exists = prev.find(lk => lk.keyResultId === krId);
      if (exists) return prev.filter(lk => lk.keyResultId !== krId);
      return [...prev, { keyResultId: krId, krContribution: 0 }];
    });
  };

  const updateContribution = (krId: string, value: number) => {
    setLinkedKRs(prev => prev.map(lk => lk.keyResultId === krId ? { ...lk, krContribution: value } : lk));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title, description, quarter, status, category, color,
      objectiveId: objectiveId && objectiveId !== 'none' ? objectiveId : undefined,
      linkedKRs,
      startMonth, endMonth: Math.max(startMonth, endMonth),
    });
    setTitle(''); setDescription(''); setStatus('planned'); setCategory('professional');
    setObjectiveId(''); setLinkedKRs([]);
    setStartMonth(0); setEndMonth(0); setColor(ROADMAP_COLORS[0]); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Nova Iniciativa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Iniciativa — {quarter}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Título</Label><Input placeholder="Ex: Lançar MVP do produto" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Detalhes da iniciativa..." value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(v) => setStatus(v as RoadmapItem['status'])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planejado</SelectItem><SelectItem value="in_progress">Em andamento</SelectItem><SelectItem value="done">Concluído</SelectItem></SelectContent></Select></div>
          <div className="space-y-2">
            <Label>Cor da barra</Label>
            <div className="flex flex-wrap gap-2">
              {ROADMAP_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/50'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2"><Label>Mês início</Label><Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent></Select></div>
            <div className="flex-1 space-y-2"><Label>Mês fim</Label><Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}</SelectContent></Select></div>
          </div>
          {objectives.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Vincular a OKR</Label>
                <Select value={objectiveId} onValueChange={(v) => { setObjectiveId(v); setLinkedKRs([]); }}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {objectives.map(o => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {selectedObjective && selectedObjective.keyResults.length > 0 && (
                <div className="space-y-3">
                  <Label>Vincular a Key Results</Label>
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    {selectedObjective.keyResults.map(kr => {
                      const linked = linkedKRs.find(lk => lk.keyResultId === kr.id);
                      return (
                        <div key={kr.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`kr-${kr.id}`}
                              checked={!!linked}
                              onCheckedChange={() => toggleKR(kr.id)}
                            />
                            <label htmlFor={`kr-${kr.id}`} className="text-sm cursor-pointer flex-1">
                              {kr.title} ({kr.currentValue}/{kr.targetValue} {kr.unit})
                            </label>
                          </div>
                          {linked && (
                            <div className="ml-6">
                              <Input
                                type="number"
                                min={0}
                                value={linked.krContribution || ''}
                                onChange={e => updateContribution(kr.id, Number(e.target.value))}
                                placeholder="Contribuição ao concluir"
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Valor que será adicionado a cada KR quando a iniciativa for concluída</p>
                </div>
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
