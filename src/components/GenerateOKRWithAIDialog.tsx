import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { useToast } from '@/hooks/use-toast';
import { OKRCategory, getCurrentQuarter, getQuarters } from '@/types/okr';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportedKR {
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
}

interface ImportedObjective {
  title: string;
  category: string;
  quarter: string;
  key_results: ImportedKR[];
}

interface Props {
  onImported: () => void;
  quarter?: string;
}

const QUARTER_OPTIONS = (() => {
  const year = new Date().getFullYear();
  return [...getQuarters(year), ...getQuarters(year + 1)];
})();

const GenerateOKRWithAIDialog = ({ onImported, quarter }: Props) => {
  const { user, session } = useAuth();
  const { activeProduct } = useProduct();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'loading' | 'preview'>('form');
  const [meta, setMeta] = useState('');
  const [periodo, setPeriodo] = useState(quarter || getCurrentQuarter());
  const [dadoAtual, setDadoAtual] = useState('');
  const [metaDesejada, setMetaDesejada] = useState('');
  const [objectives, setObjectives] = useState<ImportedObjective[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = () => {
    setStep('form');
    setMeta('');
    setDadoAtual('');
    setMetaDesejada('');
    setObjectives([]);
    setSaving(false);
    setErrorMsg(null);
    setPeriodo(quarter || getCurrentQuarter());
  };

  const handleGenerate = async () => {
    if (!meta.trim()) return;
    setErrorMsg(null);
    setStep('loading');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? session?.access_token;
      if (!accessToken) throw new Error('Inicie sessão para gerar OKRs.');
      if (!activeProduct?.id) throw new Error('Selecione um produto antes de gerar OKRs.');

      const text = [
        `Meta: ${meta.trim()}`,
        `Período: ${periodo}`,
        dadoAtual.trim() ? `Dado atual: ${dadoAtual.trim()}` : '',
        metaDesejada.trim() ? `Meta desejada: ${metaDesejada.trim()}` : '',
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase.functions.invoke('import-okrs', {
        body: { text, quarter: periodo, product_id: activeProduct.id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) {
        let detail = error.message || 'Erro ao chamar a função';
        try {
          const ctx: any = (error as any).context;
          if (ctx?.body) {
            const parsed = typeof ctx.body === 'string' ? JSON.parse(ctx.body) : ctx.body;
            if (parsed?.error) detail = parsed.error;
          }
        } catch { /* ignore */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);

      const objs: ImportedObjective[] = data?.objectives || [];
      if (objs.length === 0) throw new Error('A IA não conseguiu gerar OKRs. Tente refinar a meta.');
      setObjectives(objs);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro desconhecido');
      setStep('form');
    }
  };

  const handleConfirm = async () => {
    if (!user || !activeProduct) return;
    setSaving(true);
    try {
      for (const obj of objectives) {
        const { data: inserted } = await (supabase.from('objectives') as any)
          .insert({
            title: obj.title,
            quarter: obj.quarter || periodo,
            category: (obj.category || 'professional') as OKRCategory,
            user_id: user.id,
            product_id: activeProduct.id,
          })
          .select()
          .single();

        if (inserted && obj.key_results.length > 0) {
          await (supabase.from('key_results') as any).insert(
            obj.key_results.map(kr => ({
              title: kr.title,
              current_value: kr.current_value,
              target_value: kr.target_value,
              unit: kr.unit,
              user_id: user.id,
              product_id: activeProduct.id,
              objective_id: inserted.id,
            }))
          );
        }
      }
      toast({ title: 'OKRs gerados!', description: `${objectives.length} objetivo(s) importado(s) com sucesso.` });
      onImported();
      setOpen(false);
      reset();
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Gerar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border/50">
          <DialogTitle>
            {step === 'preview' ? 'Revise os OKRs gerados' : 'Defina sua meta'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Preencha os campos e a IA vai gerar seus OKRs automaticamente'}
            {step === 'loading' && 'Gerando OKRs com IA...'}
            {step === 'preview' && 'Confira antes de importar para o seu produto'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {errorMsg && step === 'form' && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs break-words">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {step === 'form' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="meta">Meta <span className="text-destructive">*</span></Label>
                <Input
                  id="meta"
                  value={meta}
                  onChange={e => setMeta(e.target.value)}
                  placeholder="Ex: Aumentar o NPS do produto"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="periodo">Período <span className="text-destructive">*</span></Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger id="periodo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTER_OPTIONS.map(q => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dadoAtual">
                  Dado atual <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                  id="dadoAtual"
                  value={dadoAtual}
                  onChange={e => setDadoAtual(e.target.value)}
                  placeholder="Ex: NPS 30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="metaDesejada">
                  Meta desejada <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                  id="metaDesejada"
                  value={metaDesejada}
                  onChange={e => setMetaDesejada(e.target.value)}
                  placeholder="Ex: NPS 60"
                />
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando OKRs...</p>
            </div>
          )}

          {step === 'preview' && (
            <ScrollArea className="max-h-[400px] pr-2">
              <div className="space-y-4">
                {objectives.map((obj, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm">{obj.title}</h4>
                      <Badge variant="secondary" className="text-xs shrink-0">{obj.quarter || periodo}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {obj.key_results.map((kr, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="flex-1">{kr.title}</span>
                          <span className="shrink-0 font-medium">
                            {kr.current_value}/{kr.target_value} {kr.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="shrink-0 border-t border-border/50 px-6 py-4 flex justify-end gap-2 bg-background">
          {step === 'form' && (
            <Button onClick={handleGenerate} disabled={!meta.trim()} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar OKR
            </Button>
          )}
          {step === 'loading' && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando OKRs...
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => setStep('form')}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar e Importar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateOKRWithAIDialog;
