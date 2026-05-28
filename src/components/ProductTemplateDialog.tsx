import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountedInput } from '@/components/ui/counted-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import ProductIconPicker from '@/components/ProductIconPicker';
import { uploadProductLogo } from '@/lib/productLogo';

interface KrTemplate {
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
}
interface ObjTemplate {
  title: string;
  category: string;
  key_results: KrTemplate[];
}
interface OkrTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  objectives: ObjTemplate[];
}

const CATEGORY_COLORS: Record<string, string> = {
  saas: '#6366f1',
  ecommerce: '#f59e0b',
  digital: '#10b981',
  startup: '#ef4444',
  marketplace: '#8b5cf6',
  fintech: '#0ea5e9',
};

const EMOJIS = ['📦', '🚀', '💡', '🎯', '🛒', '📱', '🎨', '⚡', '🔧', '📊', '🌍', '💎'];
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

const getCurrentQuarter = () => {
  const now = new Date();
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
};

const QUARTERS = (() => {
  const year = new Date().getFullYear();
  return [`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`, `Q1 ${year + 1}`, `Q2 ${year + 1}`];
})();

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductTemplateDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { fetchProducts, setActiveProductId } = useProduct();
  const [step, setStep] = useState<1 | 2>(1);
  const [templates, setTemplates] = useState<OkrTemplate[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [selected, setSelected] = useState<OkrTemplate | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const [color, setColor] = useState('#6366f1');
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const [creating, setCreating] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelected(null);
    setName('');
    setEmoji('🚀');
    setColor('#6366f1');
    setQuarter(getCurrentQuarter());
    setLogoFile(null);


    (async () => {
      setLoadingTpl(true);
      const { data } = await (supabase.from('okr_templates') as any)
        .select('*')
        .order('created_at');
      if (data) setTemplates(data as OkrTemplate[]);
      setLoadingTpl(false);
    })();
  }, [open]);

  const krCount = useMemo(() => {
    if (!selected) return 0;
    return selected.objectives.reduce((acc, o) => acc + (o.key_results?.length || 0), 0);
  }, [selected]);

  const handleSelect = (tpl: OkrTemplate) => {
    setSelected(tpl);
    setEmoji(tpl.icon || '🚀');
    setColor(CATEGORY_COLORS[tpl.category] || tpl.color || '#6366f1');
    setStep(2);
  };

  const handleCreate = async () => {
    if (!user || !selected) return;
    if (!name.trim()) { toast.error('Nome do produto é obrigatório'); return; }

    setCreating(true);
    try {
      // 1. Create product
      const { data: product, error: pErr } = await (supabase.from('products') as any)
        .insert({
          name: name.trim(),
          description: '',
          emoji,
          color,
          owner_id: user.id,
        })
        .select()
        .single();
      if (pErr || !product) throw pErr || new Error('Falha ao criar produto');

      // Upload logo if provided
      if (logoFile) {
        try {
          const url = await uploadProductLogo(logoFile, user.id, product.id);
          await (supabase.from('products') as any).update({ logo_url: url }).eq('id', product.id);
        } catch (e) { console.warn('logo upload falhou', e); }
      }

      // 2. Add owner as member (trigger may already do this, ignore conflict)
      await (supabase.from('product_members') as any)
        .insert({ product_id: product.id, user_id: user.id, role: 'owner' });

      // 3. Create objectives + KRs
      let totalObjs = 0;
      let totalKrs = 0;
      for (const obj of selected.objectives) {
        const { data: objective, error: oErr } = await (supabase.from('objectives') as any)
          .insert({
            title: obj.title,
            category: obj.category || 'professional',
            quarter,
            product_id: product.id,
            user_id: user.id,
          })
          .select()
          .single();
        if (oErr || !objective) continue;
        totalObjs++;

        if (obj.key_results?.length) {
          const krs = obj.key_results.map(kr => ({
            title: kr.title,
            current_value: kr.current_value ?? 0,
            target_value: kr.target_value ?? 100,
            unit: kr.unit || '%',
            objective_id: objective.id,
            product_id: product.id,
            user_id: user.id,
          }));
          const { error: krErr } = await (supabase.from('key_results') as any).insert(krs);
          if (!krErr) totalKrs += krs.length;
        }
      }

      await fetchProducts();
      toast.success(`Produto criado com ${totalObjs} objetivos e ${totalKrs} KRs! 🎉`);
      onOpenChange(false);
      setActiveProductId(product.id);
      // Navigate to OKRs after activation
      setTimeout(() => { window.location.href = '/okrs'; }, 100);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao criar produto');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>
                {step === 1 ? 'Criar produto com template' : 'Configure seu produto'}
              </DialogTitle>
              <DialogDescription>
                {step === 1
                  ? 'Escolha um template para começar com OKRs prontos'
                  : `Template selecionado: ${selected?.name || ''}`}
              </DialogDescription>
            </div>
            <Badge variant="secondary" className="shrink-0">Passo {step} de 2</Badge>
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="mt-2">
            {loadingTpl ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando templates...
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map(tpl => {
                  const borderColor = CATEGORY_COLORS[tpl.category] || tpl.color || '#6366f1';
                  const krs = tpl.objectives.reduce((a, o) => a + (o.key_results?.length || 0), 0);
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelect(tpl)}
                      className="group text-left rounded-lg border-2 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 bg-card"
                      style={{ borderColor: borderColor + '55' }}
                    >
                      <div className="text-3xl mb-2 text-center">{tpl.icon}</div>
                      <h3 className="font-semibold text-sm mb-1 text-center">{tpl.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 text-center">{tpl.description}</p>
                      <div className="flex justify-center">
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{ borderColor: borderColor + '88', color: borderColor }}
                        >
                          {tpl.objectives.length} objetivos · {krs} KRs
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && selected && (
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome do produto *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Meu SaaS" />
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <ProductIconPicker
                emoji={emoji}
                onEmojiChange={setEmoji}
                logoUrl={null}
                onLogoFileChange={(f) => setLogoFile(f)}
                emojis={EMOJIS}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quarter dos OKRs *</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium mb-2 text-muted-foreground">
                Serão criados automaticamente ({selected.objectives.length} objetivos · {krCount} KRs):
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selected.objectives.map((obj, i) => (
                  <div key={i} className="text-xs">
                    <div className="font-medium">🎯 {obj.title}</div>
                    <ul className="ml-5 mt-0.5 space-y-0.5 text-muted-foreground list-disc">
                      {obj.key_results.map((kr, j) => (
                        <li key={j}>{kr.title} <span className="opacity-60">({kr.target_value}{kr.unit})</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={creating}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Criando produto e OKRs...</>
                ) : (
                  <><Rocket className="h-4 w-4 mr-1" /> Criar Produto</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductTemplateDialog;
