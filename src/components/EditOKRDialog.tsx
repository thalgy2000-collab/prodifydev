import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountedInput } from '@/components/ui/counted-input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { Objective, KeyResult, OKRCategory } from '@/types/okr';

interface Props {
  objective: Objective;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: { title?: string; category?: OKRCategory; keyResults?: Omit<KeyResult, 'id'>[] }) => void;
}

const EditOKRDialog = ({ objective, open, onOpenChange, onSave }: Props) => {
  const [title, setTitle] = useState(objective.title);
  const [krs, setKrs] = useState<(KeyResult | Omit<KeyResult, 'id'> & { id?: string })[]>(objective.keyResults);

  useEffect(() => {
    setTitle(objective.title); setKrs(objective.keyResults);
  }, [objective]);

  const addKR = () => setKrs([...krs, { title: '', currentValue: 0, targetValue: 0, unit: '%' }]);
  const removeKR = (i: number) => setKrs(krs.filter((_, idx) => idx !== i));
  const updateKR = (i: number, field: string, value: string | number) => {
    const next = [...krs]; next[i] = { ...next[i], [field]: value }; setKrs(next);
  };

  const handleSubmit = () => {
    if (!title.trim() || krs.some(kr => !kr.title.trim())) return;
    onSave(objective.id, { title, keyResults: krs });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Editar Objetivo</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <CountedInput maxLength={100} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Key Results</Label>
              <Button variant="ghost" size="sm" onClick={addKR} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Adicionar KR</Button>
            </div>
            {krs.map((kr, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <CountedInput maxLength={100} inline placeholder="Descrição do KR" value={kr.title} onChange={e => updateKR(i, 'title', e.target.value)} containerClassName="flex-1" />
                  {krs.length > 1 && (<Button variant="ghost" size="icon" onClick={() => removeKR(i)} className="h-8 w-8 shrink-0"><X className="h-3 w-3" /></Button>)}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1"><Label className="text-xs text-muted-foreground">Atual</Label><Input type="number" value={kr.currentValue === 0 || kr.currentValue == null ? '' : kr.currentValue} onChange={e => updateKR(i, 'currentValue', e.target.value === '' ? 0 : Number(e.target.value))} placeholder="Ex: 10" /></div>
                  <div className="flex-1 space-y-1"><Label className="text-xs text-muted-foreground">Meta</Label><Input type="number" value={kr.targetValue === 0 || kr.targetValue == null ? '' : kr.targetValue} onChange={e => updateKR(i, 'targetValue', e.target.value === '' ? 0 : Number(e.target.value))} placeholder="Ex: 100" /></div>
                  <div className="w-20 space-y-1"><Label className="text-xs text-muted-foreground">Unidade</Label><Input value={kr.unit} onChange={e => updateKR(i, 'unit', e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} className="w-full">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditOKRDialog;
