import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RiceContextData {
  descricao: string;
  publicoImpactado: string;
  nivelImpacto: string;
  objetivoId: string;
  complexidade: string;
  evidencias: string;
}

interface RiceContextModalProps {
  task: { id: string; title: string; description?: string | null } | null;
  objectives: { id: string; title: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: RiceContextData) => void;
  isLoading: boolean;
}

const IMPACT_OPTIONS = [
  { value: 'critico', label: '🔴 Crítico', desc: 'Resolve dor principal do usuário' },
  { value: 'alto', label: '🟠 Alto', desc: 'Melhoria significativa na experiência' },
  { value: 'medio', label: '🟡 Médio', desc: 'Melhoria incremental' },
  { value: 'baixo', label: '🟢 Baixo', desc: 'Nice-to-have' },
];

const COMPLEXITY_OPTIONS = [
  { value: 'horas', label: '⚡ Muito simples', desc: 'Algumas horas' },
  { value: '1-2dias', label: '🔧 Simples', desc: '1 a 2 dias' },
  { value: '1semana', label: '🏗️ Médio', desc: 'Aprox. 1 semana' },
  { value: '2semanas+', label: '🚀 Complexo', desc: '2 semanas ou mais' },
];

export function RiceContextModal({
  task,
  objectives,
  open,
  onOpenChange,
  onGenerate,
  isLoading,
}: RiceContextModalProps) {
  const [descricao, setDescricao] = useState('');
  const [publicoImpactado, setPublicoImpactado] = useState('');
  const [nivelImpacto, setNivelImpacto] = useState('');
  const [objetivoId, setObjetivoId] = useState('none');
  const [complexidade, setComplexidade] = useState('');
  const [evidencias, setEvidencias] = useState('');

  useEffect(() => {
    if (open && task) {
      setDescricao(task.description || '');
      setPublicoImpactado('');
      setNivelImpacto('');
      setObjetivoId('none');
      setComplexidade('');
      setEvidencias('');
    }
  }, [open, task]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-[#1a1a1a] text-white border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b border-white/[0.08] shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Contexto RICE da Tarefa
          </DialogTitle>
          <DialogDescription className="text-[#8892a4] mt-1.5">
            Forneça mais detalhes para que a IA possa calibrar o RICE score para a tarefa: <strong className="text-white">{task.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-6" style={{ maxHeight: 'calc(90vh - 160px)' }}>
          <div className="space-y-2">
            <label className="text-sm font-medium">1. Descrição do Problema / Benefício</label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que essa tarefa resolve e qual o benefício esperado..."
              className="resize-none h-20 bg-white/[0.02] border-white/[0.08] placeholder:text-[#555]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">2. Quem será impactado?</label>
            <Input
              value={publicoImpactado}
              onChange={(e) => setPublicoImpactado(e.target.value)}
              placeholder="Ex: Todos os usuários Pro, apenas admins, novos usuários..."
              className="bg-white/[0.02] border-white/[0.08] placeholder:text-[#555]"
            />
            <p className="text-[10px] text-[#8892a4] uppercase tracking-wide">Ajuda a calibrar o Alcance (Reach)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">3. Nível de Impacto Esperado</label>
            <div className="grid grid-cols-2 gap-3">
              {IMPACT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNivelImpacto(opt.value)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                    nivelImpacto === opt.value
                      ? "bg-primary/20 border-primary"
                      : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06]"
                  )}
                >
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-xs text-[#8892a4] mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-wide pt-1">Ajuda a calibrar o Impacto (Impact)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">4. Objetivo Estratégico (OKR)</label>
            <Select value={objetivoId} onValueChange={setObjetivoId}>
              <SelectTrigger className="bg-white/[0.02] border-white/[0.08]">
                <SelectValue placeholder="Selecione um objetivo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.08] text-white">
                <SelectItem value="none">Nenhum objetivo específico</SelectItem>
                {objectives.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">5. Complexidade Técnica</label>
            <div className="grid grid-cols-2 gap-3">
              {COMPLEXITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setComplexidade(opt.value)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                    complexidade === opt.value
                      ? "bg-primary/20 border-primary"
                      : "bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06]"
                  )}
                >
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-xs text-[#8892a4] mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8892a4] uppercase tracking-wide pt-1">Ajuda a calibrar o Esforço (Effort)</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">6. Evidências / Dados (Opcional)</label>
            <Textarea
              value={evidencias}
              onChange={(e) => setEvidencias(e.target.value)}
              placeholder="Ex: 40% dos usuários pediram isso no suporte, NPS caiu..."
              className="resize-none h-20 bg-white/[0.02] border-white/[0.08] placeholder:text-[#555]"
            />
            <p className="text-[10px] text-[#8892a4] uppercase tracking-wide pt-1">Ajuda a calibrar a Confiança (Confidence)</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/[0.08] shrink-0 flex justify-end gap-3 bg-[#1a1a1a]">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="text-[#8892a4] hover:text-white">
            Cancelar
          </Button>
          <Button onClick={() => onGenerate({ descricao, publicoImpactado, nivelImpacto, objetivoId: objetivoId === 'none' ? '' : objetivoId, complexidade, evidencias })} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar Sugestão RICE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
