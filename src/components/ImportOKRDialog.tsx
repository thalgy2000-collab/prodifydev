import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { useToast } from '@/hooks/use-toast';
import { OKRCategory, getCurrentQuarter } from '@/types/okr';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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

interface ImportOKRDialogProps {
  onImported: () => void;
  quarter?: string;
}

const ACCEPTED = '.pdf,.txt,.docx,.csv,.md';

const ImportOKRDialog = ({ onImported, quarter }: ImportOKRDialogProps) => {
  const { user, session } = useAuth();
  const { activeProduct } = useProduct();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'loading' | 'preview'>('upload');
  const [objectives, setObjectives] = useState<ImportedObjective[]>([]);
  const [saving, setSaving] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const targetQuarter = quarter || getCurrentQuarter();

  const reset = () => {
    setStep('upload');
    setObjectives([]);
    setSaving(false);
    setPastedText('');
    setErrorMsg(null);
  };

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const callImport = async (payload: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? session?.access_token;
    if (!accessToken) {
      throw new Error('Inicie sessão para importar OKRs. A função exige autenticação.');
    }
    if (!activeProduct?.id) {
      throw new Error('Selecione um produto antes de importar OKRs.');
    }

    const body: Record<string, unknown> = {
      ...payload,
      product_id: activeProduct.id,
      quarter: targetQuarter,
    };

    // Validação client-side: se for envio por texto, garantir não-vazio
    if ('text' in body && (!body.text || String(body.text).trim().length === 0)) {
      throw new Error('O campo de texto está vazio. Cole algum conteúdo ou selecione um arquivo.');
    }

    console.log('[import-okrs] enviando body:', {
      hasText: 'text' in body,
      textLen: typeof body.text === 'string' ? body.text.length : 0,
      hasFile: 'fileBase64' in body,
      fileName: (body as any).fileName,
      product_id: body.product_id,
      quarter: body.quarter,
    });

    const { data, error } = await supabase.functions.invoke('import-okrs', {
      body,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (error) {
      // Tenta extrair mensagem de erro do contexto (FunctionsHttpError)
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
    if (objs.length === 0) throw new Error('Nenhum objetivo encontrado no conteúdo enviado.');
    return objs;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setStep('loading');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let objs: ImportedObjective[];

      if (ext === 'txt' || ext === 'md' || ext === 'csv') {
        // Para texto puro, enviamos como `text` direto (mais leve e atende ao contrato).
        const text = (await readFileAsText(file)).trim();
        if (!text) throw new Error('Arquivo vazio.');
        objs = await callImport({ text });
      } else {
        // PDF/DOCX precisam ser parseados na edge function via base64.
        const fileBase64 = await readFileAsBase64(file);
        objs = await callImport({ fileBase64, fileName: file.name });
      }

      setObjectives(objs);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro desconhecido');
      setStep('upload');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmitText = async () => {
    const text = pastedText.trim();
    if (!text) {
      setErrorMsg('Cole ou digite algum conteúdo antes de continuar.');
      return;
    }
    setErrorMsg(null);
    setStep('loading');
    try {
      const objs = await callImport({ text });
      setObjectives(objs);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro desconhecido');
      setStep('upload');
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
            quarter: obj.quarter || targetQuarter,
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

      toast({ title: 'Importado!', description: `${objectives.length} objetivo(s) importado(s) com sucesso.` });
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
          <Upload className="h-4 w-4 mr-2" />
          Importar via arquivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar OKRs com IA</DialogTitle>
          <DialogDescription>
            {step === 'upload' && `Envie um arquivo ou cole o conteúdo. Trimestre alvo: ${targetQuarter}.`}
            {step === 'loading' && 'Analisando conteúdo com IA...'}
            {step === 'preview' && 'Revise os OKRs extraídos antes de importar.'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && step !== 'preview' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs break-words">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {step === 'upload' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6">
              <div className="rounded-full bg-secondary p-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground text-center">Formatos aceitos: PDF, TXT, DOCX, CSV, MD</p>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Selecionar arquivo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={handleFile}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou cole o texto</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Cole aqui o conteúdo dos seus objetivos para a IA estruturar..."
              className="min-h-[120px] text-sm"
            />
            <Button onClick={handleSubmitText} disabled={!pastedText.trim()}>
              Analisar texto
            </Button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando conteúdo com IA...</p>
          </div>
        )}

        {step === 'preview' && (
          <>
            <ScrollArea className="max-h-[400px] pr-2">
              <div className="space-y-4">
                {objectives.map((obj, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{obj.title}</h4>
                      <Badge variant="secondary" className="text-xs">{obj.quarter || targetQuarter}</Badge>
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
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar e Importar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportOKRDialog;
