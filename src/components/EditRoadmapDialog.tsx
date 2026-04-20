import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RoadmapItem, RoadmapItemKR, ROADMAP_COLORS } from '@/types/roadmap';
import { Objective, OKRCategory, getQuarterMonths } from '@/types/okr';

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
  const [linkedKRs, setLinkedKRs] = useState<RoadmapItemKR[]>(item.linkedKRs || []);
  const [startMonth, setStartMonth] = useState(item.startMonth);
  const [endMonth, setEndMonth] = useState(item.endMonth);
  const [color, setColor] = useState(item.color || ROADMAP_COLORS[0]);

  const months = getQuarterMonths(item.quarter);
  const quarterObjectives = objectives.filter(o => o.quarter === item.quarter);
  const selectedObjective = quarterObjectives.find(o => o.id === objectiveId);

  useEffect(() => {
    setTitle(item.title); setDescription(item.description); setStatus(item.status);
    setCategory(item.category); setObjectiveId(item.objectiveId || '');
    setLinkedKRs(item.linkedKRs || []);
    setStartMonth(item.startMonth); setEndMonth(item.endMonth);
    setColor(item.color || ROADMAP_COLORS[0]);
  }, [item]);

  useEffect(() => {
    if (!objectiveId || objectiveId === 'none') return;
    const isInQuarter = quarterObjectives.some(o => o.id === objectiveId);
    if (!isInQuarter) {
      setObjectiveId('none');
      setLinkedKRs([]);
    }
  }, [objectiveId, quarterObjectives]);

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
    onSave({
      ...item, title, description, status, category, color,
      objectiveId: objectiveId && objectiveId !== 'none' ? objectiveId : undefined,
      linkedKRs,
      startMonth, endMonth: Math.max(startMonth, endMonth),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Iniciativa</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
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
          {quarterObjectives.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Vincular a OKR</Label>
                <Select value={objectiveId || 'none'} onValueChange={(v) => { setObjectiveId(v); setLinkedKRs([]); }}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {quarterObjectives.map(o => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}
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
                              id={`edit-kr-${kr.id}`}
                              checked={!!linked}
                              onCheckedChange={() => toggleKR(kr.id)}
                            />
                            <label htmlFor={`edit-kr-${kr.id}`} className="text-sm cursor-pointer flex-1">
                              {kr.title} ({kr.currentValue}/{kr.targetValue} {kr.unit})
                            </label>
                          </div>
                          {linked && (
                            <div className="ml-6">
                              <Input
                                type="number"
                                min={0}
                                value={linked.krContribution ? linked.krContribution : ''}
                                onChange={e => updateContribution(kr.id, e.target.value === '' ? 0 : Number(e.target.value))}
                                placeholder="Ex: contribuição ao concluir"
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
          <Button onClick={handleSubmit} className="w-full">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoadmapDialog;
