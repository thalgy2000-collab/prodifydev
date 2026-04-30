import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoadmapItem, RoadmapItemKR, ROADMAP_COLORS, getQuarterFromDate, formatDateOnly, parseDateOnly } from '@/types/roadmap';
import { Objective, OKRCategory } from '@/types/okr';

interface Props {
  quarter: string;
  objectives: Objective[];
  onAdd: (data: Omit<RoadmapItem, 'id' | 'createdAt'>) => void;
}

const CreateRoadmapDialog = ({ quarter, objectives, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [category, setCategory] = useState<OKRCategory>('professional');
  const [objectiveId, setObjectiveId] = useState<string>('');
  const [linkedKRs, setLinkedKRs] = useState<RoadmapItemKR[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [color, setColor] = useState(ROADMAP_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    if (!title.trim()) return;
    if (!startDate || !endDate) {
      setError('Datas de início e término são obrigatórias');
      return;
    }
    if (endDate <= startDate) {
      setError('A data de término deve ser após a data de início');
      return;
    }
    const status: RoadmapItem['status'] = progress >= 100 ? 'done' : progress > 0 ? 'in_progress' : 'planned';
    const computedQuarter = getQuarterFromDate(startDate);
    const startMonth = startDate.getMonth() % 3;
    const endMonth = Math.max(startMonth, endDate.getMonth() % 3);
    onAdd({
      title, description, quarter: computedQuarter, status, progress, category, color,
      objectiveId: objectiveId && objectiveId !== 'none' ? objectiveId : undefined,
      linkedKRs,
      startMonth, endMonth,
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
    });
    setTitle(''); setDescription(''); setProgress(0); setCategory('professional');
    setObjectiveId(''); setLinkedKRs([]);
    setStartDate(undefined); setEndDate(undefined);
    setColor(ROADMAP_COLORS[0]); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Nova Iniciativa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Iniciativa{startDate ? ` — ${getQuarterFromDate(startDate)}` : quarter ? ` — ${quarter}` : ''}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2"><Label>Título</Label><Input placeholder="Ex: Lançar MVP do produto" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Detalhes da iniciativa..." value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Progresso</Label>
              <span className="text-sm font-mono text-muted-foreground">{progress}%</span>
            </div>
            <Slider value={[progress]} min={0} max={100} step={1} onValueChange={([v]) => setProgress(v)} />
          </div>
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
            <div className="flex-1 space-y-2">
              <Label>Data de início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>dd/mm/aaaa</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Data de término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : <span>dd/mm/aaaa</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
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
          <Button onClick={handleSubmit} className="w-full">Criar Iniciativa</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapDialog;
