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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from '@/components/discovery/TagInput';
import { Plus, Pencil, Trash2, ArrowLeft, Monitor, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

type Status = 'planned' | 'in_progress' | 'completed';

interface UsabilityTest {
  id: string;
  title: string;
  objective: string | null;
  date: string | null;
  participants: number | null;
  findings: string[] | null;
  improvements: string[] | null;
  status: Status | null;
}

const STATUS: Record<Status, { label: string; color: string }> = {
  planned: { label: 'Planejado', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  in_progress: { label: 'Em andamento', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  completed: { label: 'Concluído', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
};

const empty = { title: '', objective: '', date: '', participants: 0, findings: [] as string[], improvements: [] as string[], status: 'planned' as Status };

export default function UsabilityTestsPage() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [items, setItems] = useState<UsabilityTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UsabilityTest | null>(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('usability_tests').select('*').eq('product_id', activeProduct.id).order('date', { ascending: false, nullsFirst: false });
    if (error) toast.error('Erro ao carregar testes');
    else setItems(data as UsabilityTest[]);
    setLoading(false);
  }, [activeProduct]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: UsabilityTest) => {
    setEditing(it);
    setForm({
      title: it.title,
      objective: it.objective || '',
      date: it.date || '',
      participants: it.participants || 0,
      findings: it.findings || [],
      improvements: it.improvements || [],
      status: (it.status as Status) || 'planned',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!activeProduct || !user) return;
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return; }
    const payload = {
      product_id: activeProduct.id,
      user_id: user.id,
      title: form.title.trim(),
      objective: form.objective || null,
      date: form.date || null,
      participants: form.participants || null,
      findings: form.findings,
      improvements: form.improvements,
      status: form.status,
    };
    const op = editing
      ? supabase.from('usability_tests').update(payload).eq('id', editing.id)
      : supabase.from('usability_tests').insert(payload);
    const { error } = await op;
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success(editing ? 'Atualizado' : 'Criado');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este teste?')) return;
    const { error } = await supabase.from('usability_tests').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluído');
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
            <Monitor className="h-7 w-7 text-emerald-400" /> Testes de Usabilidade
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Valide a solução com usuários reais</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Teste</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Nenhum teste registrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(it => {
            const status = STATUS[(it.status as Status) || 'planned'];
            return (
              <div key={it.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{it.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {it.objective && <p className="text-xs text-muted-foreground mb-3 line-clamp-2 whitespace-pre-wrap">{it.objective}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                  <span className={`px-2 py-1 rounded border ${status.color}`}>{status.label}</span>
                  {it.date && <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(it.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}
                  {!!it.participants && <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {it.participants} participantes</span>}
                </div>
                {it.findings && it.findings.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] uppercase font-semibold text-blue-400 mb-1">Descobertas</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                      {it.findings.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}
                {it.improvements && it.improvements.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-emerald-400 mb-1">Melhorias</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                      {it.improvements.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Teste' : 'Novo Teste'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} maxLength={200} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Textarea rows={3} maxLength={1000} value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Participantes</Label>
                <Input type="number" min={0} value={form.participants} onChange={e => setForm({ ...form, participants: parseInt(e.target.value) || 0 })} />
              </div>
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
            </div>
            <div>
              <Label>Descobertas</Label>
              <TagInput value={form.findings} onChange={(v) => setForm({ ...form, findings: v })} color="bg-blue-500/15 text-blue-400 border-blue-500/30" />
            </div>
            <div>
              <Label>Melhorias identificadas</Label>
              <TagInput value={form.improvements} onChange={(v) => setForm({ ...form, improvements: v })} color="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" />
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
