import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription , DialogFooter} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, AlertCircle, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PRIORITY_CONFIG, TaskPriority } from '@/types/backlog';

type Mode = 'file' | 'ai';

interface ImportedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  status: string;
}

interface Props {
  mode: Mode;
  onImported: () => void;
  addTask: (data: any) => Promise<void> | void;
}

const ACCEPTED = '.pdf,.txt,.docx,.csv,.md';

const ImportTasksDialog = ({ mode, onImported, addTask }: Props) => {
  const { user, session } = useAuth();
  const { activeProduct } = useProduct();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'input' | 'loading' | 'preview'>('input');
  const [tasks, setTasks] = useState<ImportedTask[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI form fields
  const [descricao, setDescricao] = useState('');
  const [contexto, setContexto] = useState('');

  const reset = () => {
    setStep('input');
    setTasks([]);
    setSelected(new Set());
    setSaving(false);
    setErrorMsg(null);
    setDescricao('');
    setContexto('');
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const callImport = async (payload: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? session?.access_token;
    if (!accessToken) throw new Error('Inicie sessão para continuar.');
    if (!activeProduct?.id) throw new Error('Selecione um produto.');

    const { data, error } = await supabase.functions.invoke('import-tasks', {
      body: payload,
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

    const list: ImportedTask[] = (data?.tasks || []).map((t: any) => ({
      title: t.title || '',
      description: t.description || '',
      priority: (['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium') as TaskPriority,
      status: 'open',
    }));
    if (list.length === 0) throw new Error('Nenhuma tarefa gerada.');
    return list;
  };

  const showPreview = (list: ImportedTask[]) => {
    setTasks(list);
    setSelected(new Set(list.map((_, i) => i)));
    setStep('preview');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStep('loading');
    try {
      const fileBase64 = await readFileAsBase64(file);
      const list = await callImport({ fileBase64, fileName: file.name });
      showPreview(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro desconhecido');
      setStep('input');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!descricao.trim()) return;
    setErrorMsg(null);
    setStep('loading');
    try {
      const text = `Feature: ${descricao.trim()}${contexto.trim() ? `\n\nContexto: ${contexto.trim()}` : ''}`;
      const list = await callImport({ text });
      showPreview(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro desconhecido');
      setStep('input');
    }
  };

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!user || !activeProduct) return;
    const chosen = tasks.filter((_, i) => selected.has(i));
    if (chosen.length === 0) {
      toast.error('Selecione ao menos uma tarefa');
      return;
    }
    setSaving(true);
    try {
      for (const t of chosen) {
        await addTask({
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: 'open',
          category: 'professional',
          completionPercentage: 0,
          roadmapImpact: 0,
        });
      }

      toast.success(`${chosen.length} tarefa(s) importada(s) com sucesso ✓`);
      onImported();
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const trigger = mode === 'file' ? (
    <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />Importar arquivo</Button>
  ) : (
    <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" />Gerar com IA</Button>
  );

  const titles = mode === 'file'
    ? { title: 'Importar tarefas via arquivo', sub: 'Envie um arquivo para extrair tarefas com IA automaticamente' }
    : { title: 'Gerar tarefas com IA', sub: 'Descreva o que precisa ser feito e a IA vai criar as tarefas' };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg h-[90vh] sm:h-[85vh] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
          <DialogTitle>
            {step === 'preview' ? 'Tarefas extraídas — revise antes de importar' : titles.title}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && titles.sub}
            {step === 'loading' && (mode === 'file' ? 'Analisando arquivo com IA...' : 'Gerando tarefas com IA...')}
            {step === 'preview' && 'Selecione quais tarefas deseja importar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 space-y-4">

        {errorMsg && step !== 'preview' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs break-words">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {step === 'input' && mode === 'file' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6">
            <div className="rounded-full bg-secondary p-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground text-center">Formatos aceitos: PDF, TXT, DOCX, CSV, MD</p>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Selecionar arquivo
            </Button>
            <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFile} />
          </div>
        )}

        {step === 'input' && mode === 'ai' && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descreva a feature ou épico <span className="text-destructive">*</span></Label>
              <Textarea
                id="desc"
                rows={4}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Criar sistema de autenticação com login social via Google e GitHub, recuperação de senha por e-mail e perfil do usuário"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctx">Contexto adicional <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Textarea
                id="ctx"
                rows={2}
                value={contexto}
                onChange={e => setContexto(e.target.value)}
                placeholder="Ex: Projeto em React com Supabase, usuários são PMs e designers"
              />
            </div>
            </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {mode === 'file' ? 'Analisando arquivo com IA...' : 'Gerando tarefas com IA...'}
            </p>
          </div>
        )}

        {step === 'preview' && (
          <>
            <ScrollArea className="max-h-[400px] pr-2">
              <div className="space-y-2">
                {tasks.map((t, i) => {
                  const cfg = PRIORITY_CONFIG[t.priority];
                  return (
                    <label
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                    >
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={() => toggle(i)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{t.title}</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                            style={{ backgroundColor: `hsl(${cfg.color} / 0.15)`, color: `hsl(${cfg.color})` }}
                          >
                            {cfg.label}
                          </Badge>
                        </div>
                        {t.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
        </div>

        {(step === 'input' && mode === 'ai') || step === 'preview' ? (
          <DialogFooter className="px-6 py-4 shrink-0 border-t border-border/50 bg-background flex flex-row items-center justify-between w-full">
            {step === 'preview' ? (
              <>
                <span className="text-xs text-muted-foreground mr-auto">
                  {selected.size} de {tasks.length} tarefas selecionadas
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button onClick={handleConfirm} disabled={saving || selected.size === 0}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    ✅ Importar Selecionadas
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end w-full">
                <Button onClick={handleGenerate} disabled={!descricao.trim()} className="w-full gap-2">
                  <Sparkles className="h-4 w-4" /> Gerar Tarefas
                </Button>
              </div>
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ImportTasksDialog;
