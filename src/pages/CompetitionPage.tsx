import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { competitionTourSteps } from '@/lib/featureTours';

type CompetitorType = 'direct' | 'indirect' | 'substitute' | 'potential';
type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

interface Competitor {
  id: string;
  product_id: string;
  user_id: string;
  competitor_name: string;
  competitor_type: CompetitorType;
  website_url: string | null;
  target_audience: string | null;
  value_proposition: string | null;
  price_model: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  differentiators: string[] | null;
  threat_level: ThreatLevel | null;
  notes: string | null;
}

interface Criterion {
  id: string;
  product_id: string;
  user_id: string;
  name: string;
  weight: number | null;
}

interface Score {
  id: string;
  competitor_id: string;
  criteria_id: string;
  score: number | null;
}

const TYPE_CONFIG: Record<CompetitorType, { label: string; subtitle: string; emoji: string; ring: string; bg: string }> = {
  direct: { label: 'Diretos', subtitle: 'Mesma solução, mesmo público', emoji: '🔴', ring: 'border-red-500/40', bg: 'bg-red-500/5' },
  indirect: { label: 'Indiretos', subtitle: 'Solução diferente, mesmo problema', emoji: '🟠', ring: 'border-orange-500/40', bg: 'bg-orange-500/5' },
  substitute: { label: 'Substitutos', subtitle: 'O cliente resolve de outra forma', emoji: '🟡', ring: 'border-yellow-500/40', bg: 'bg-yellow-500/5' },
  potential: { label: 'Potenciais', subtitle: 'Podem entrar no mercado', emoji: '🟢', ring: 'border-green-500/40', bg: 'bg-green-500/5' },
};

const THREAT_CONFIG: Record<ThreatLevel, { label: string; emoji: string; className: string }> = {
  critical: { label: 'Crítico', emoji: '🔴', className: 'bg-red-500/15 text-red-500 border-red-500/30' },
  high: { label: 'Alto', emoji: '🟠', className: 'bg-orange-500/15 text-orange-500 border-orange-500/30' },
  medium: { label: 'Médio', emoji: '🟡', className: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' },
  low: { label: 'Baixo', emoji: '🟢', className: 'bg-green-500/15 text-green-500 border-green-500/30' },
};

const DEFAULT_CRITERIA = ['Preço', 'UX/Usabilidade', 'Funcionalidades', 'Integrações', 'Suporte', 'Escalabilidade'];

const emptyForm = (): Partial<Competitor> => ({
  competitor_name: '',
  competitor_type: 'direct',
  website_url: '',
  target_audience: '',
  value_proposition: '',
  price_model: '',
  strengths: [],
  weaknesses: [],
  differentiators: [],
  threat_level: 'medium',
  notes: '',
});

const TagInput = ({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...value, v]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="icon" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const CompetitionPage = () => {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const { toast } = useToast();

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [form, setForm] = useState<Partial<Competitor>>(emptyForm());

  const [newCriterion, setNewCriterion] = useState('');

  const fetchAll = async () => {
    if (!activeProduct) return;
    setLoading(true);
    const [cRes, krRes] = await Promise.all([
      supabase.from('competitive_analysis').select('*').eq('product_id', activeProduct.id).order('competitor_name'),
      supabase.from('competitive_criteria').select('*').eq('product_id', activeProduct.id).order('name'),
    ]);
    const comps = (cRes.data ?? []) as Competitor[];
    const crits = (krRes.data ?? []) as Criterion[];
    setCompetitors(comps);
    setCriteria(crits);

    if (comps.length > 0) {
      const sRes = await supabase.from('competitive_scores').select('*').in('competitor_id', comps.map(c => c.id));
      setScores((sRes.data ?? []) as Score[]);
    } else {
      setScores([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProduct?.id]);

  // Seed default criteria once if none exist
  useEffect(() => {
    const seed = async () => {
      if (!activeProduct || !user || loading) return;
      if (criteria.length === 0) {
        const rows = DEFAULT_CRITERIA.map(name => ({ name, weight: 1, product_id: activeProduct.id, user_id: user.id }));
        const { data } = await supabase.from('competitive_criteria').insert(rows).select();
        if (data) setCriteria(data as Criterion[]);
      }
    };
    seed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activeProduct?.id]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (c: Competitor) => {
    setEditing(c);
    setForm({ ...c });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!activeProduct || !user) return;
    if (!form.competitor_name?.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    const payload = {
      product_id: activeProduct.id,
      user_id: user.id,
      competitor_name: form.competitor_name!.trim(),
      competitor_type: form.competitor_type ?? 'direct',
      website_url: form.website_url || null,
      target_audience: form.target_audience || null,
      value_proposition: form.value_proposition || null,
      price_model: form.price_model || null,
      strengths: form.strengths ?? [],
      weaknesses: form.weaknesses ?? [],
      differentiators: form.differentiators ?? [],
      threat_level: form.threat_level ?? 'medium',
      notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from('competitive_analysis').update(payload).eq('id', editing.id);
      if (error) return toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      toast({ title: 'Concorrente atualizado' });
    } else {
      const { error } = await supabase.from('competitive_analysis').insert(payload);
      if (error) return toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      toast({ title: 'Concorrente adicionado' });
    }
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este concorrente?')) return;
    const { error } = await supabase.from('competitive_analysis').delete().eq('id', id);
    if (error) return toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    toast({ title: 'Excluído' });
    fetchAll();
  };

  const addCriterion = async () => {
    if (!activeProduct || !user) return;
    const name = newCriterion.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('competitive_criteria')
      .insert({ name, weight: 1, product_id: activeProduct.id, user_id: user.id })
      .select()
      .single();
    if (error) return toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    setCriteria([...criteria, data as Criterion]);
    setNewCriterion('');
  };

  const deleteCriterion = async (id: string) => {
    if (!confirm('Excluir este critério?')) return;
    await supabase.from('competitive_criteria').delete().eq('id', id);
    setCriteria(criteria.filter(c => c.id !== id));
    setScores(scores.filter(s => s.criteria_id !== id));
  };

  const updateScore = async (competitorId: string, criteriaId: string, raw: string) => {
    const num = Math.max(0, Math.min(10, Number(raw) || 0));
    const existing = scores.find(s => s.competitor_id === competitorId && s.criteria_id === criteriaId);
    if (existing) {
      setScores(scores.map(s => s.id === existing.id ? { ...s, score: num } : s));
      await supabase.from('competitive_scores').update({ score: num }).eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('competitive_scores')
        .insert({ competitor_id: competitorId, criteria_id: criteriaId, score: num })
        .select()
        .single();
      if (data) setScores(prev => [...prev, data as Score]);
    }
  };

  const getScore = (compId: string, critId: string) => {
    const s = scores.find(x => x.competitor_id === compId && x.criteria_id === critId);
    return s?.score ?? 0;
  };

  const totalScore = (compId: string) => {
    if (criteria.length === 0) return 0;
    let sum = 0;
    let weights = 0;
    for (const c of criteria) {
      const w = c.weight ?? 1;
      sum += getScore(compId, c.id) * w;
      weights += w;
    }
    return weights > 0 ? (sum / weights).toFixed(1) : '0';
  };

  const grouped = useMemo(() => {
    const g: Record<CompetitorType, Competitor[]> = { direct: [], indirect: [], substitute: [], potential: [] };
    competitors.forEach(c => { g[c.competitor_type]?.push(c); });
    return g;
  }, [competitors]);

  const [activeTab, setActiveTab] = useState<'map' | 'table'>('map');
  const tourSteps = useMemo(() => competitionTourSteps.map(s => {
    if (s.selector === '#competition-table-tab' || s.selector === '#competition-table') {
      return { ...s, before: () => setActiveTab('table') };
    }
    return { ...s, before: () => setActiveTab('map') };
  }), []);
  const { TourElement } = useFeatureTour('concorrencia', tourSteps);

  if (!activeProduct) return null;

  return (
    <div id="competition-map" data-tour-feature="comp-map" className="space-y-6">
      {TourElement}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Mapa de Alternativas
          </h1>
          <p className="text-sm text-muted-foreground">Analise seus concorrentes e alternativas de mercado</p>
        </div>
        <Button id="add-competitor-btn" onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Adicionar Concorrente
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'map' | 'table')}>
        <TabsList>
          <TabsTrigger id="competition-map-tab" value="map">Mapa Visual</TabsTrigger>
          <TabsTrigger id="competition-table-tab" value="table">Tabela Comparativa</TabsTrigger>
        </TabsList>

        {/* MAP TAB */}
        <TabsContent value="map" className="mt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : competitors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhum concorrente adicionado ainda. Clique em "Adicionar Concorrente" para começar.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(TYPE_CONFIG) as CompetitorType[]).map(type => {
                const cfg = TYPE_CONFIG[type];
                const list = grouped[type];
                return (
                  <Card key={type} className={cn('border', cfg.ring, cfg.bg)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span>{cfg.emoji}</span> {cfg.label}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{cfg.subtitle}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {list.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhum concorrente</p>
                      ) : (
                        list.map(c => {
                          const threat = c.threat_level ? THREAT_CONFIG[c.threat_level] : null;
                          return (
                            <div key={c.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="font-medium text-sm text-foreground">{c.competitor_name}</div>
                                {threat && (
                                  <Badge variant="outline" className={cn('text-[10px] shrink-0', threat.className)}>
                                    {threat.emoji} {threat.label}
                                  </Badge>
                                )}
                              </div>
                              {c.value_proposition && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{c.value_proposition}</p>
                              )}
                              {c.strengths && c.strengths.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Pontos fortes</p>
                                  <div className="flex flex-wrap gap-1">
                                    {c.strengths.slice(0, 3).map((s, i) => (
                                      <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {c.differentiators && c.differentiators.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Diferenciais</p>
                                  <div className="flex flex-wrap gap-1">
                                    {c.differentiators.slice(0, 3).map((s, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-1 pt-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(c)}>
                                  <Pencil className="h-3 w-3 mr-1" /> Editar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                                  <Trash2 className="h-3 w-3 mr-1" /> Excluir
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TABLE TAB */}
        <TabsContent value="table" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Novo critério..."
              value={newCriterion}
              onChange={e => setNewCriterion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCriterion(); }}
              className="sm:max-w-xs"
            />
            <Button onClick={addCriterion} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Critério
            </Button>
          </div>

          {competitors.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Adicione concorrentes para preencher a matriz.</CardContent></Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-semibold sticky left-0 bg-muted/50 z-10 min-w-[160px]">Concorrente</th>
                    {criteria.map(c => (
                      <th key={c.id} className="p-3 font-semibold text-center min-w-[120px]">
                        <div className="flex items-center justify-center gap-1">
                          {c.name}
                          <button onClick={() => deleteCriterion(c.id)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 font-semibold text-center bg-primary/5 min-w-[100px]">Score Total</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map(comp => (
                    <tr key={comp.id} className="border-t border-border">
                      <td className="p-3 font-medium sticky left-0 bg-card z-10">{comp.competitor_name}</td>
                      {criteria.map(c => (
                        <td key={c.id} className="p-2 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            value={getScore(comp.id, c.id)}
                            onChange={e => updateScore(comp.id, c.id, e.target.value)}
                            className="h-9 w-16 mx-auto text-center"
                          />
                        </td>
                      ))}
                      <td className="p-3 text-center font-bold text-primary bg-primary/5">{totalScore(comp.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar concorrente' : 'Novo concorrente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do concorrente *</Label>
                <Input value={form.competitor_name ?? ''} onChange={e => setForm({ ...form, competitor_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.competitor_type} onValueChange={v => setForm({ ...form, competitor_type: v as CompetitorType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">🔴 Direto</SelectItem>
                    <SelectItem value="indirect">🟠 Indireto</SelectItem>
                    <SelectItem value="substitute">🟡 Substituto</SelectItem>
                    <SelectItem value="potential">🟢 Potencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input type="url" placeholder="https://..." value={form.website_url ?? ''} onChange={e => setForm({ ...form, website_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Público-alvo</Label>
                <Input value={form.target_audience ?? ''} onChange={e => setForm({ ...form, target_audience: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Proposta de valor</Label>
              <Textarea rows={2} value={form.value_proposition ?? ''} onChange={e => setForm({ ...form, value_proposition: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo de preço</Label>
                <Input value={form.price_model ?? ''} onChange={e => setForm({ ...form, price_model: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nível de ameaça</Label>
                <Select value={form.threat_level ?? 'medium'} onValueChange={v => setForm({ ...form, threat_level: v as ThreatLevel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Baixo</SelectItem>
                    <SelectItem value="medium">🟡 Médio</SelectItem>
                    <SelectItem value="high">🟠 Alto</SelectItem>
                    <SelectItem value="critical">🔴 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pontos fortes</Label>
              <TagInput value={form.strengths ?? []} onChange={v => setForm({ ...form, strengths: v })} placeholder="Adicionar e pressionar Enter" />
            </div>
            <div className="space-y-2">
              <Label>Pontos fracos</Label>
              <TagInput value={form.weaknesses ?? []} onChange={v => setForm({ ...form, weaknesses: v })} placeholder="Adicionar e pressionar Enter" />
            </div>
            <div className="space-y-2">
              <Label>Diferenciais</Label>
              <TagInput value={form.differentiators ?? []} onChange={v => setForm({ ...form, differentiators: v })} placeholder="Adicionar e pressionar Enter" />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea rows={3} value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompetitionPage;
