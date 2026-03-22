import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { KeyResult, OKRCategory } from '@/types/okr';

interface Props {
  quarter: string;
  onAdd: (title: string, quarter: string, category: OKRCategory, keyResults: Omit<KeyResult, 'id'>[]) => void;
}

const CreateOKRDialog = ({ quarter, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [krs, setKrs] = useState<Omit<KeyResult, 'id'>[]>([
    { title: '', currentValue: 0, targetValue: 100, unit: '%' },
  ]);

  const addKR = () => setKrs([...krs, { title: '', currentValue: 0, targetValue: 100, unit: '%' }]);
  const removeKR = (i: number) => setKrs(krs.filter((_, idx) => idx !== i));
  const updateKR = (i: number, field: string, value: string | number) => {
    const next = [...krs];
    next[i] = { ...next[i], [field]: value };
    setKrs(next);
  };

  const handleSubmit = () => {
    if (!title.trim() || krs.some(kr => !kr.title.trim())) return;
    onAdd(title, quarter, 'professional', krs);
    setTitle('');
    setKrs([{ title: '', currentValue: 0, targetValue: 100, unit: '%' }]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Novo Objetivo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Criar Objetivo — {quarter}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Input placeholder="Ex: Aumentar a receita recorrente" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Key Results</Label>
              <Button variant="ghost" size="sm" onClick={addKR} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Adicionar KR</Button>
            </div>
            {krs.map((kr, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="flex items-center gap-2">
                  <Input placeholder="Descrição do KR" value={kr.title} onChange={e => updateKR(i, 'title', e.target.value)} className="flex-1" />
                  {krs.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeKR(i)} className="h-8 w-8 shrink-0"><X className="h-3 w-3" /></Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Meta</Label>
                    <Input type="number" value={kr.targetValue} onChange={e => updateKR(i, 'targetValue', Number(e.target.value))} />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs text-muted-foreground">Unidade</Label>
                    <Input value={kr.unit} onChange={e => updateKR(i, 'unit', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} className="w-full">Criar Objetivo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOKRDialog;
