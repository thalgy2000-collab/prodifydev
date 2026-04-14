import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { useToast } from '@/hooks/use-toast';
import { OKRCategory } from '@/types/okr';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

const ACCEPTED = '.pdf,.txt,.docx,.csv,.md';

const ImportOKRDialog = ({ onImported }: ImportOKRDialogProps) => {
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'loading' | 'preview'>('upload');
  const [objectives, setObjectives] = useState<ImportedObjective[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setObjectives([]);
    setSaving(false);
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('loading');

    try {
      const content = await readFile(file);

      const { data, error } = await supabase.functions.invoke('import-okrs', {
        body: { fileContent: content },
      });

      if (error) throw new Error(error.message || 'Erro ao processar arquivo');
      if (data?.error) throw new Error(data.error);

      const objs: ImportedObjective[] = data?.objectives || [];
      if (objs.length === 0) throw new Error('Nenhum objetivo encontrado no arquivo');

      setObjectives(objs);
      setStep('preview');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      reset();
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirm = async () => {
    if (!user || !activeProduct) return;
    setSaving(true);

    try {
      for (const obj of objectives) {
        const { data: inserted } = await (supabase.from('objectives') as any)
          .insert({
            title: obj.title,
            quarter: obj.quarter,
            category: obj.category as OKRCategory,
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
          <DialogTitle>Importar OKRs via arquivo</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Envie um arquivo para extrair objetivos e resultados-chave com IA.'}
            {step === 'loading' && 'Analisando arquivo com IA...'}
            {step === 'preview' && 'Revise os OKRs extraídos antes de importar.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-secondary p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Formatos aceitos: PDF, TXT, DOCX, CSV, MD</p>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
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
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando arquivo com IA...</p>
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
                      <Badge variant="secondary" className="text-xs">{obj.quarter}</Badge>
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
