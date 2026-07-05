import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { CsdItem, CsdCategory, CsdImpactLevel, CsdStatus } from '@/types/csd';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Pencil, Link2, MoreHorizontal, FlaskConical, AlertTriangle, X, Lightbulb } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Column config ──
const COLUMNS: {
  key: CsdCategory;
  label: string;
  icon: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    key: 'certainty',
    label: 'Certezas',
    icon: '✅',
    subtitle: 'O que sabemos',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
  },
  {
    key: 'assumption',
    label: 'Suposições',
    icon: '🤔',
    subtitle: 'O que assumimos',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
  },
  {
    key: 'doubt',
    label: 'Dúvidas',
    icon: '❓',
    subtitle: 'O que ainda não sabemos',
    color: 'text-red-500',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
  },
];

const IMPACT: Record<CsdImpactLevel, { label: string; badge: string; desc: string }> = {
  high: { label: '🔴 Alto', badge: 'bg-red-500/10 text-red-500 border-red-500/30', desc: 'Pode inviabilizar a solução' },
  medium: { label: '🟡 Médio', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30', desc: 'Afeta parcialmente' },
  low: { label: '🟢 Baixo', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', desc: 'Impacto marginal' },
};

const STATUS_MAP: Record<CsdStatus, { label: string; badge: string }> = {
  open: { label: '⚪ Aberto', badge: 'bg-muted text-muted-foreground border-border' },
  in_validation: { label: '🔵 Em validação', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  resolved: { label: '✅ Resolvido', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
};

const PLACEHOLDERS: Record<CsdCategory, string> = {
  certainty: 'Ex: Sabemos que 80% dos usuários acessam via mobile',
  assumption: 'Ex: Assumimos que os usuários preferem notificação push a email',
  doubt: 'Ex: Não sabemos se o preço é uma barreira de entrada',
};

interface HypothesisOption {
  id: string;
  statement: string;
}

const emptyForm = {
  category: 'assumption' as CsdCategory,
  statement: '',
  impact_level: 'medium' as CsdImpactLevel,
  status: 'open' as CsdStatus,
  validation_method: '',
  notes: '',
  hypothesis_id: '' as string,
};

export default function CsdMatrixPage() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const { user } = useAuth();

  const [items, setItems] = useState<CsdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CsdItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [hypotheses, setHypotheses] = useState<HypothesisOption[]>([]);
  const [showTip, setShowTip] = useState(() => {
    try { return localStorage.getItem('csd_tip_dismissed') !== 'true'; } catch { return true; }
  });
  const [dragOverCol, setDragOverCol] = useState<CsdCategory | null>(null);

  // ── Load data ──
  const load = useCallback(async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('csd_matrix')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('position', { ascending: true });
    if (error) toast.error('Erro ao carregar Matriz CSD');
    else setItems((data || []) as CsdItem[]);
    setLoading(false);
  }, [activeProduct]);

  const loadHypotheses = useCallback(async () => {
    if (!activeProduct) return;
    const { data } = await supabase
      .from('hypotheses')
      .select('id, statement')
      .eq('product_id', activeProduct.id)
      .order('created_at', { ascending: false });
    if (data) setHypotheses(data as HypothesisOption[]);
  }, [activeProduct]);

  useEffect(() => { load(); loadHypotheses(); }, [load, loadHypotheses]);

  // ── Counts ──
  const counts = {
    certainty: items.filter(i => i.category === 'certainty').length,
    assumption: items.filter(i => i.category === 'assumption').length,
    doubt: items.filter(i => i.category === 'doubt').length,
  };

  // ── Alert: high-impact unvalidated items older than 7 days ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const criticalItems = items.filter(
    i => (i.category === 'assumption' || i.category === 'doubt') &&
      i.impact_level === 'high' &&
      i.status === 'open' &&
      new Date(i.created_at) < sevenDaysAgo
  );

  // ── CRUD ──
  const openCreate = (category: CsdCategory) => {
    setEditing(null);
    setForm({ ...emptyForm, category });
    setOpen(true);
  };

  const openEdit = (item: CsdItem) => {
    setEditing(item);
    setForm({
      category: item.category,
      statement: item.statement,
      impact_level: item.impact_level,
      status: item.status,
      validation_method: item.validation_method || '',
      notes: item.notes || '',
      hypothesis_id: item.hypothesis_id || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.statement.trim() || !activeProduct || !user) return;

    const payload = {
      product_id: activeProduct.id,
      user_id: user.id,
      category: form.category,
      statement: form.statement.trim(),
      impact_level: form.impact_level,
      status: form.status,
      validation_method: form.validation_method || null,
      notes: form.notes || null,
      hypothesis_id: form.hypothesis_id || null,
      position: editing ? undefined : items.filter(i => i.category === form.category).length,
    };

    if (editing) {
      const { position: _, ...updatePayload } = payload;
      const { error } = await (supabase as any)
        .from('csd_matrix')
        .update(updatePayload)
        .eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Item atualizado!');
    } else {
      const { error } = await (supabase as any)
        .from('csd_matrix')
        .insert(payload);
      if (error) { toast.error('Erro ao criar item'); console.error(error); return; }
      toast.success('Item criado!');
    }
    setOpen(false);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Excluir este item?')) return;
    await (supabase as any).from('csd_matrix').delete().eq('id', id);
    load();
  };

  const moveCategory = async (id: string, newCat: CsdCategory) => {
    await (supabase as any).from('csd_matrix').update({ category: newCat }).eq('id', id);
    toast.success('Item movido!');
    load();
  };

  // ── Transform to Hypothesis ──
  const transformToHypothesis = async (item: CsdItem) => {
    if (!activeProduct || !user) return;

    const { data, error } = await supabase.from('hypotheses').insert({
      product_id: activeProduct.id,
      user_id: user.id,
      statement: `Acreditamos que ${item.statement}`,
      assumption: item.statement,
      status: 'not_validated',
      confidence: 50,
    }).select('id').single();

    if (error || !data) {
      toast.error('Erro ao criar hipótese');
      return;
    }

    await (supabase as any).from('csd_matrix')
      .update({ hypothesis_id: data.id, status: 'in_validation' })
      .eq('id', item.id);

    toast.success('Hipótese criada e vinculada!');
    load();
    loadHypotheses();
  };

  // ── Drag & Drop ──
  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, col: CsdCategory) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const onDragLeave = () => setDragOverCol(null);

  const onDrop = async (e: React.DragEvent, newCategory: CsdCategory) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData('text/plain');
    const item = items.find(i => i.id === id);
    if (!item || item.category === newCategory) return;
    await moveCategory(id, newCategory);
  };

  // ── Dismiss tip ──
  const dismissTip = () => {
    setShowTip(false);
    try { localStorage.setItem('csd_tip_dismissed', 'true'); } catch {}
  };

  if (!activeProduct) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <button
        onClick={() => navigate('/discovery/problema')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao Diamante 1
      </button>

      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">🧩 Matriz CSD</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          O que você sabe, assume ou tem dúvida sobre a solução?
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <Button onClick={() => openCreate('assumption')} className="gap-2">
            <Plus className="h-4 w-4" /> Novo item
          </Button>
        </div>
      </header>

      {/* Tip */}
      {showTip && (
        <div className="relative mb-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 pr-10">
          <button onClick={dismissTip} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Fluxo sugerido:</strong> mapeie Certezas/Suposições/Dúvidas →
              transforme as mais críticas em Hipóteses → valide com Testes de Usabilidade
            </p>
          </div>
        </div>
      )}

      {/* Dashboard */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {COLUMNS.map(col => (
          <div key={col.key} className={cn('rounded-xl border p-4 text-center', col.borderColor, col.bgColor)}>
            <p className="text-3xl font-bold text-foreground">{counts[col.key]}</p>
            <p className={cn('text-sm font-semibold mt-1', col.color)}>{col.icon} {col.label}</p>
          </div>
        ))}
      </div>

      {/* Alert */}
      {criticalItems.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">⚠️ Atenção:</strong> Você tem{' '}
            <strong>{criticalItems.length}</strong> suposição(ões)/dúvida(s) de alto impacto ainda não
            validada(s). Considere criar hipóteses para testá-las.
          </p>
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => {
            const colItems = items.filter(i => i.category === col.key);
            return (
              <div
                key={col.key}
                onDragOver={e => onDragOver(e, col.key)}
                onDragLeave={onDragLeave}
                onDrop={e => onDrop(e, col.key)}
                className={cn(
                  'rounded-xl border p-4 min-h-[300px] transition-all',
                  col.borderColor,
                  dragOverCol === col.key ? `${col.bgColor} ring-2 ring-offset-2 ring-offset-background` : 'bg-card',
                  dragOverCol === col.key && col.key === 'certainty' && 'ring-emerald-500/50',
                  dragOverCol === col.key && col.key === 'assumption' && 'ring-amber-500/50',
                  dragOverCol === col.key && col.key === 'doubt' && 'ring-red-500/50',
                )}
              >
                <div className="mb-4">
                  <h3 className={cn('text-sm font-bold flex items-center gap-2', col.color)}>
                    <span className="text-lg">{col.icon}</span> {col.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{col.subtitle}</p>
                </div>

                <div className="space-y-2">
                  {colItems.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={e => onDragStart(e, item.id)}
                      className={cn(
                        'rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing',
                        'hover:border-primary/30 transition-all group relative',
                        'hover:shadow-md'
                      )}
                    >
                      {/* Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            {item.category !== 'certainty' && (
                              <DropdownMenuItem onClick={() => moveCategory(item.id, 'certainty')}>
                                ✅ Mover para Certezas
                              </DropdownMenuItem>
                            )}
                            {item.category !== 'assumption' && (
                              <DropdownMenuItem onClick={() => moveCategory(item.id, 'assumption')}>
                                🤔 Mover para Suposições
                              </DropdownMenuItem>
                            )}
                            {item.category !== 'doubt' && (
                              <DropdownMenuItem onClick={() => moveCategory(item.id, 'doubt')}>
                                ❓ Mover para Dúvidas
                              </DropdownMenuItem>
                            )}
                            {(item.category === 'assumption' || item.category === 'doubt') &&
                              item.impact_level === 'high' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => transformToHypothesis(item)}>
                                  <FlaskConical className="h-3.5 w-3.5 mr-2" /> 🧪 Transformar em Hipótese
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteItem(item.id)} className="text-red-500 focus:text-red-500">
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-sm text-foreground pr-6 leading-relaxed">{item.statement}</p>

                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', IMPACT[item.impact_level].badge)}>
                          {IMPACT[item.impact_level].label}
                        </span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', STATUS_MAP[item.status].badge)}>
                          {STATUS_MAP[item.status].label}
                        </span>
                        {item.hypothesis_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-500 font-medium flex items-center gap-0.5">
                            <Link2 className="h-2.5 w-2.5" /> Hipótese
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => openCreate(col.key)}
                  className={cn(
                    'mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium transition-colors',
                    'text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30',
                    col.borderColor,
                  )}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md !p-0 !gap-0 !flex !flex-col !max-h-[95vh] sm:!max-h-[90vh] !overflow-hidden">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle>{editing ? 'Editar Item' : 'Novo Item CSD'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLUMNS.map(col => (
                  <button
                    key={col.key}
                    onClick={() => setForm(f => ({ ...f, category: col.key }))}
                    className={cn(
                      'rounded-lg border p-2.5 text-center text-xs font-medium transition-all',
                      form.category === col.key
                        ? `${col.borderColor} ${col.bgColor} ${col.color} ring-1 ${col.key === 'certainty' ? 'ring-emerald-500/40' : col.key === 'assumption' ? 'ring-amber-500/40' : 'ring-red-500/40'}`
                        : 'border-border hover:border-primary/30 text-muted-foreground'
                    )}
                  >
                    <span className="text-lg block mb-1">{col.icon}</span>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Statement */}
            <div className="space-y-2">
              <Label>Afirmação *</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                maxLength={200}
                value={form.statement}
                onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
                placeholder={PLACEHOLDERS[form.category]}
              />
              <p className="text-xs text-muted-foreground text-right">{form.statement.length}/200</p>
            </div>

            {/* Impact */}
            <div className="space-y-2">
              <Label>Nível de Impacto</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(IMPACT) as [CsdImpactLevel, typeof IMPACT['high']][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, impact_level: key }))}
                    className={cn(
                      'rounded-lg border p-2.5 text-center text-xs transition-all',
                      form.impact_level === key ? `${val.badge} ring-1` : 'border-border hover:border-primary/30 text-muted-foreground'
                    )}
                  >
                    <span className="block font-semibold">{val.label}</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">{val.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: string) => setForm(f => ({ ...f, status: v as CsdStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_MAP) as [CsdStatus, typeof STATUS_MAP['open']][]).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hypothesis Link */}
            <div className="space-y-2">
              <Label>Vincular a uma Hipótese (opcional)</Label>
              <Select value={form.hypothesis_id || '_none'} onValueChange={(v: string) => setForm(f => ({ ...f, hypothesis_id: v === '_none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhuma</SelectItem>
                  {hypotheses.map(h => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.statement.length > 60 ? h.statement.slice(0, 60) + '…' : h.statement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Validation Method */}
            <div className="space-y-2">
              <Label>Método de Validação</Label>
              <Input
                value={form.validation_method}
                onChange={e => setForm(f => ({ ...f, validation_method: e.target.value }))}
                placeholder="Ex: Entrevista com 5 usuários, Teste A/B"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <div className="flex-shrink-0 px-6 py-4 border-t border-border">
            <Button onClick={save} disabled={!form.statement.trim()} className="w-full">
              {editing ? 'Salvar Alterações' : 'Criar Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
