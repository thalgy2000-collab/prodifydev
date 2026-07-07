import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useProblemStatement, ProblemStatement } from '@/hooks/useProblemStatement';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ProblemStatement | null;
  onSaved?: () => void;
}

export default function ProblemStatementModal({ open, onOpenChange, initial, onSaved }: Props) {
  const { saveNewVersion } = useProblemStatement();
  const [problem, setProblem] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setProblem(initial?.problem ?? '');
      setObjective(initial?.objective ?? '');
      setAudience(initial?.target_audience ?? '');
    }
  }, [open, initial]);

  const save = async () => {
    if (!problem.trim() || !objective.trim()) {
      toast.error('Problema e Objetivo são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await saveNewVersion({ problem: problem.trim(), objective: objective.trim(), target_audience: audience.trim() || null });
      toast.success('Nova versão salva');
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Problema e Objetivo do Produto</DialogTitle>
          <DialogDescription>
            Em uma frase clara: qual problema vocês resolvem e o que querem alcançar?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Problema *</Label>
            <Textarea
              rows={3}
              maxLength={250}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Ex: Os PMs de startup perdem tempo alternando entre 4-6 ferramentas desconectadas, sem visão unificada entre estratégia e execução"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-muted-foreground">Descreva a dor real do seu usuário, não a solução</p>
              <p className="text-[11px] text-muted-foreground">{problem.length}/250</p>
            </div>
          </div>

          <div>
            <Label>Objetivo *</Label>
            <Textarea
              rows={3}
              maxLength={250}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Unificar discovery, planejamento e delivery em uma única plataforma orientada por dados"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-muted-foreground">O que o produto busca alcançar para resolver esse problema</p>
              <p className="text-[11px] text-muted-foreground">{objective.length}/250</p>
            </div>
          </div>

          <div>
            <Label>Público-alvo</Label>
            <Input
              maxLength={150}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex: PMs de startups em estágio inicial com times de 10-50 pessoas"
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{audience.length}/150</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>Salvar nova versão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
