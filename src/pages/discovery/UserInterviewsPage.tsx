import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TagInput } from '@/components/discovery/TagInput';
import { Plus, Pencil, Trash2, ArrowLeft, Mic, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Interview {
  id: string;
  interviewee_name: string;
  interviewee_role: string | null;
  date: string | null;
  key_insights: string[] | null;
  pain_points: string[] | null;
  notes: string | null;
  created_at: string;
}

const empty = { interviewee_name: '', interviewee_role: '', date: '', key_insights: [] as string[], pain_points: [] as string[], notes: '' };

export default function UserInterviewsPage() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_interviews')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('date', { ascending: false, nullsFirst: false });
    if (error) toast.error('Erro ao carregar entrevistas');
    else setItems(data as Interview[]);
    setLoading(false);
  }, [activeProduct]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: Interview) => {
    setEditing(it);
    setForm({
      interviewee_name: it.interviewee_name,
      interviewee_role: it.interviewee_role || '',
      date: it.date || '',
      key_insights: it.key_insights || [],
      pain_points: it.pain_points || [],
      notes: it.notes || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!activeProduct || !user) return;
    if (!form.interviewee_name.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      product_id: activeProduct.id,
      user_id: user.id,
      interviewee_name: form.interviewee_name.trim(),
      interviewee_role: form.interviewee_role || null,
      date: form.date || null,
      key_insights: form.key_insights,
      pain_points: form.pain_points,
      notes: form.notes || null,
    };
    const op = editing
      ? supabase.from('user_interviews').update(payload).eq('id', editing.id)
      : supabase.from('user_interviews').insert(payload);
    const { error } = await op;
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success(editing ? 'Atualizado' : 'Criado');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta entrevista?')) return;
    const { error } = await supabase.from('user_interviews').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluída');
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/discovery')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Voltar para Discovery
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Mic className="h-7 w-7 text-blue-400" /> Entrevistas com Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Registre insights de conversas com usuários reais</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Entrevista</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Nenhuma entrevista registrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(it => (
            <div key={it.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{it.interviewee_name}</h3>
                  {it.interviewee_role && <p className="text-xs text-muted-foreground">{it.interviewee_role}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {it.date && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                  <Calendar className="h-3 w-3" /> {new Date(it.date).toLocaleDateString('pt-BR')}
                </p>
              )}
              {it.key_insights && it.key_insights.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Insights</p>
                  <div className="flex flex-wrap gap-1">
                    {it.key_insights.map((t, i) => <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{t}</Badge>)}
                  </div>
                </div>
              )}
              {it.pain_points && it.pain_points.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Dores</p>
                  <div className="flex flex-wrap gap-1">
                    {it.pain_points.map((t, i) => <Badge key={i} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">{t}</Badge>)}
                  </div>
                </div>
              )}
              {it.notes && <p className="text-xs text-muted-foreground mt-3 line-clamp-3 whitespace-pre-wrap">{it.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Entrevista' : 'Nova Entrevista'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do entrevistado *</Label>
              <Input value={form.interviewee_name} maxLength={120} onChange={e => setForm({ ...form, interviewee_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cargo/Função</Label>
                <Input value={form.interviewee_role} maxLength={120} onChange={e => setForm({ ...form, interviewee_role: e.target.value })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Principais insights</Label>
              <TagInput value={form.key_insights} onChange={(v) => setForm({ ...form, key_insights: v })} color="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" />
            </div>
            <div>
              <Label>Dores identificadas</Label>
              <TagInput value={form.pain_points} onChange={(v) => setForm({ ...form, pain_points: v })} color="bg-red-500/15 text-red-400 border-red-500/30" />
            </div>
            <div>
              <Label>Anotações</Label>
              <Textarea rows={4} maxLength={2000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
