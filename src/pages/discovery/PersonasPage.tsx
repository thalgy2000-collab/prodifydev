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
import { TagInput } from '@/components/discovery/TagInput';
import { Plus, Pencil, Trash2, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

interface Persona {
  id: string;
  name: string;
  role: string | null;
  age_range: string | null;
  goals: string[] | null;
  frustrations: string[] | null;
  behaviors: string[] | null;
  bio: string | null;
  avatar_emoji: string | null;
}

const EMOJIS = ['👤','👩','👨','🧑','👵','👴','👩‍💼','👨‍💼','👩‍💻','👨‍💻','👩‍🎓','👨‍🎓','🧑‍🔬','🧑‍🎨','🦸','🦸‍♀️'];

const empty = { name: '', role: '', age_range: '', goals: [] as string[], frustrations: [] as string[], behaviors: [] as string[], bio: '', avatar_emoji: '👤' };

export default function PersonasPage() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [items, setItems] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('personas').select('*').eq('product_id', activeProduct.id).order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar personas');
    else setItems(data as Persona[]);
    setLoading(false);
  }, [activeProduct]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it: Persona) => {
    setEditing(it);
    setForm({
      name: it.name,
      role: it.role || '',
      age_range: it.age_range || '',
      goals: it.goals || [],
      frustrations: it.frustrations || [],
      behaviors: it.behaviors || [],
      bio: it.bio || '',
      avatar_emoji: it.avatar_emoji || '👤',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!activeProduct || !user) return;
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      product_id: activeProduct.id,
      user_id: user.id,
      name: form.name.trim(),
      role: form.role || null,
      age_range: form.age_range || null,
      goals: form.goals,
      frustrations: form.frustrations,
      behaviors: form.behaviors,
      bio: form.bio || null,
      avatar_emoji: form.avatar_emoji,
    };
    const op = editing
      ? supabase.from('personas').update(payload).eq('id', editing.id)
      : supabase.from('personas').insert(payload);
    const { error } = await op;
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success(editing ? 'Atualizada' : 'Criada');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta persona?')) return;
    const { error } = await supabase.from('personas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluída');
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <ProblemStatementBanner />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/discovery')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Voltar para Discovery
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-2">
            <User className="h-7 w-7 text-purple-400" /> Personas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Crie perfis dos seus usuários ideais</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Persona</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">Nenhuma persona criada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(it => (
            <div key={it.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-5xl leading-none">{it.avatar_emoji || '👤'}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{it.name}</h3>
                    {it.role && <p className="text-xs text-muted-foreground truncate">{it.role}</p>}
                    {it.age_range && <p className="text-[10px] text-muted-foreground">{it.age_range}</p>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {it.bio && <p className="text-xs text-muted-foreground mb-3 line-clamp-3 whitespace-pre-wrap">{it.bio}</p>}
              {[
                { label: 'Objetivos', items: it.goals, color: 'text-emerald-400' },
                { label: 'Frustrações', items: it.frustrations, color: 'text-red-400' },
                { label: 'Comportamentos', items: it.behaviors, color: 'text-blue-400' },
              ].map(sec => sec.items && sec.items.length > 0 && (
                <div key={sec.label} className="mb-2">
                  <p className={`text-[10px] uppercase font-semibold ${sec.color} mb-1`}>{sec.label}</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                    {sec.items.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Persona' : 'Nova Persona'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Avatar</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setForm({ ...form, avatar_emoji: e })}
                    className={`text-2xl w-10 h-10 rounded-md border ${form.avatar_emoji === e ? 'border-primary bg-primary/10' : 'border-border bg-card'} hover:border-primary`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} maxLength={120} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cargo</Label>
                <Input value={form.role} maxLength={120} onChange={e => setForm({ ...form, role: e.target.value })} />
              </div>
              <div>
                <Label>Faixa etária</Label>
                <Input placeholder="Ex: 25-34" value={form.age_range} maxLength={30} onChange={e => setForm({ ...form, age_range: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Objetivos</Label>
              <TagInput value={form.goals} onChange={(v) => setForm({ ...form, goals: v })} color="bg-emerald-500/15 text-emerald-400 border-emerald-500/30" />
            </div>
            <div>
              <Label>Frustrações</Label>
              <TagInput value={form.frustrations} onChange={(v) => setForm({ ...form, frustrations: v })} color="bg-red-500/15 text-red-400 border-red-500/30" />
            </div>
            <div>
              <Label>Comportamentos</Label>
              <TagInput value={form.behaviors} onChange={(v) => setForm({ ...form, behaviors: v })} color="bg-blue-500/15 text-blue-400 border-blue-500/30" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea rows={3} maxLength={1000} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
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
