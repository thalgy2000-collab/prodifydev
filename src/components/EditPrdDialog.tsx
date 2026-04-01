import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { PRD } from '@/types/prd';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  prd: PRD | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, changes: Partial<PRD>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditPrdDialog({ prd, open, onOpenChange, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState<Partial<PRD>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prdIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prd) {
      setForm({ ...prd });
      prdIdRef.current = prd.id;
    }
  }, [prd]);

  const autosave = useCallback((changes: Partial<PRD>) => {
    if (!prdIdRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = prdIdRef.current;
    timerRef.current = setTimeout(() => {
      onUpdate(id, changes);
    }, 800);
  }, [onUpdate]);

  const set = (key: keyof PRD, value: any) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      autosave({ [key]: value });
      return next;
    });
  };

  const handleListAdd = (key: 'functionalRequirements' | 'nonFunctionalRequirements' | 'successMetrics') => {
    const list = [...(form[key] as string[] || []), ''];
    set(key, list);
  };

  const handleListChange = (key: 'functionalRequirements' | 'nonFunctionalRequirements' | 'successMetrics', idx: number, value: string) => {
    const list = [...(form[key] as string[] || [])];
    list[idx] = value;
    set(key, list);
  };

  const handleListRemove = (key: 'functionalRequirements' | 'nonFunctionalRequirements' | 'successMetrics', idx: number) => {
    const list = (form[key] as string[] || []).filter((_, i) => i !== idx);
    set(key, list);
  };

  if (!prd) return null;

  const statusLabel: Record<string, string> = { draft: 'Rascunho', in_review: 'Em revisão', approved: 'Aprovado' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Editar PRD</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] px-6 pb-6">
          <div className="space-y-4 pr-2">
            {/* Title + Version + Status row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label>Título</Label>
                <Input value={form.title || ''} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <Label>Versão</Label>
                <Input value={form.version || ''} onChange={e => set('version', e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status || 'draft'} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Problema a resolver</Label>
              <Textarea rows={3} value={form.problem || ''} onChange={e => set('problem', e.target.value)} />
            </div>

            <div>
              <Label>Objetivo do produto</Label>
              <Textarea rows={3} value={form.objective || ''} onChange={e => set('objective', e.target.value)} />
            </div>

            <div>
              <Label>Público-alvo</Label>
              <Textarea rows={3} value={form.targetAudience || ''} onChange={e => set('targetAudience', e.target.value)} />
            </div>

            {/* Editable lists */}
            {([
              ['functionalRequirements', 'Requisitos funcionais'],
              ['nonFunctionalRequirements', 'Requisitos não funcionais'],
              ['successMetrics', 'Métricas de sucesso'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="space-y-2 mt-1">
                  {((form[key] as string[]) || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={e => handleListChange(key, idx, e.target.value)}
                        placeholder={`Item ${idx + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleListRemove(key, idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handleListAdd(key)} className="gap-1">
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <Label>Fora do escopo</Label>
              <Textarea rows={3} value={form.outOfScope || ''} onChange={e => set('outOfScope', e.target.value)} />
            </div>

            <div>
              <Label>Cronograma estimado</Label>
              <Textarea rows={3} value={form.estimatedTimeline || ''} onChange={e => set('estimatedTimeline', e.target.value)} />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="destructive" size="sm" onClick={() => { onDelete(prd.id); onOpenChange(false); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir PRD
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
