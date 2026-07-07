import { useState, useEffect, useCallback } from 'react';
import ProblemStatementBanner from '@/components/discovery/ProblemStatementBanner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, ArrowLeft, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

type Status = 'not_validated' | 'in_progress' | 'validated' | 'invalidated';

interface Hypothesis {
  id: string;
  statement: string;
  assumption: string | null;
  validation_method: string | null;
  status: Status | null;
  confidence: number | null;
  notes: string | null;
}

const STATUS: Record<Status, { label: string; color: string; dot: string }> = {
  not_validated: { label: 'Não validada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-500' },
  in_progress: { label: 'Em progresso', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-500' },
  validated: { label: 'Validada', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500' },
  invalidated: { label: 'Invalidada', color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-500' },
};

const empty = { statement: '', assumption: '', validation_method: '', status: 'not_validated' as Status, confidence: 50, notes: '' };

export default function HypothesesPage() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [items, setItems] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hypothesis | null>(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('hypotheses').select('*').eq('product_id', activeProduct.id).order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar hipóteses');
    else setItems(data as Hypothesis[]);
    setLoading(false);
  }, [activeProduct]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: Hypothesis) => {
    setEditing(it);
    setForm({
      statement: it.statement,
      assumption: it.assumption || '',
      validation_method: it.validation_method || '',
      status: (it.status as Status) || 'not_validated',
      confidence: it.confidence ?? 50,
      notes: it.notes || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!activeProduct || !user) return;
    if (!form.statement.trim()) { toast.error('Hipótese é obrigatória'); return; }
    const payload = {
      product_id: activeProduct.id,
      user_id: user.id,
      statement: form.statement.trim(),
      assumption: form.assumption || null,
      validation_method: form.validation_method || null,
      status: form.status,
      confidence: form.confidence,
      notes: form.notes || null,
    };
    const op = editing
      ? supabase.from('hypotheses').update(payload).eq('id', editing.id)
      : supabase.from('hypotheses').insert(payload);
    const { error } = await op;
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success(editing ? 'Atualizada' : 'Criada');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta hipótese?')) return;
    const { error } = await supabase.from('hypotheses').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluída');
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <ProblemStatementBanner />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/discovery')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Voltar para Discovery
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-orange-400" /> Hipóteses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Formule e valide hipóteses de solução</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Hipótese</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Nenhuma hipótese cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(it => {
            const status = STATUS[(it.status as Status) || 'not_validated'];
            const conf = it.confidence ?? 0;
            return (
              <div key={it.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-medium text-foreground flex-1 whitespace-pre-wrap">{it.statement}</p>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${status.color}`}>
                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <span className="text-muted-foreground">Confiança</span>
                    <div className="flex-1 h-1.5 bg-muted rounded">
                      <div className="h-full bg-primary rounded" style={{ width: `${conf}%` }} />
                    </div>
                    <span className="font-mono text-foreground">{conf}%</span>
                  </div>
                  {it.validation_method && <span className="text-muted-foreground">📋 {it.validation_method}</span>}
                </div>
                {it.notes && <p className="text-xs text-muted-foreground mt-3 line-clamp-2 whitespace-pre-wrap">{it.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Hipótese' : 'Nova Hipótese'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hipótese *</Label>
              <Textarea rows={3} maxLength={1000} placeholder="Acreditamos que [solução] vai resolver [problema] para [persona]"
                value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })} />
            </div>
            <div>
              <Label>Premissa / Assunção</Label>
              <Textarea rows={2} maxLength={500} value={form.assumption} onChange={e => setForm({ ...form, assumption: e.target.value })} />
            </div>
            <div>
              <Label>Método de validação</Label>
              <Input value={form.validation_method} maxLength={200} onChange={e => setForm({ ...form, validation_method: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS) as Status[]).map(k => (
                      <SelectItem key={k} value={k}>{STATUS[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Confiança: {form.confidence}%</Label>
                <Slider value={[form.confidence]} min={0} max={100} step={5} onValueChange={(v) => setForm({ ...form, confidence: v[0] })} className="mt-3" />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea rows={3} maxLength={1000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
