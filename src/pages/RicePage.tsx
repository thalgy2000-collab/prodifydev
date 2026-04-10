import { useState } from 'react';
import { useRiceStore } from '@/hooks/useRiceStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useToast } from '@/hooks/use-toast';
import { calcRiceScore, IMPACT_OPTIONS, CONFIDENCE_OPTIONS } from '@/types/rice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save } from 'lucide-react';

const RicePage = () => {
  const { scores, setScore, getScore } = useRiceStore();
  const { tasks } = useBacklogStore();
  const { items: initiatives } = useRoadmapStore();
  const { toast } = useToast();
  const [pendingScores, setPendingScores] = useState<Record<string, any>>({});

  const allItems = [
    ...tasks.map(t => ({ id: t.id, title: t.title, type: 'task' as const })),
    ...initiatives.map(i => ({ id: i.id, title: i.title, type: 'initiative' as const })),
  ];

  const ranked = allItems.map(item => {
    const score = getScore(item.id);
    const r = score?.reach ?? 5;
    const i = score?.impact ?? 1;
    const c = score?.confidence ?? 0.8;
    const e = score?.effort ?? 1;
    return { ...item, r, i, c, e, total: calcRiceScore(r, i, c, e) };
  });

  const getValue = (id: string, field: string, fallback: any) => {
    return pendingScores[id]?.[field] ?? fallback;
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setPendingScores(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSaveAndReprioritize = () => {
    Object.entries(pendingScores).forEach(([id, fieldsObj]) => {
      const item = allItems.find(i => i.id === id);
      if (item) {
        setScore(id, item.type, fieldsObj);
      }
    });
    setPendingScores({});
    
    // Reorder by score
    const reprioritized = allItems.map(item => {
      const score = getScore(item.id);
      const r = score?.reach ?? 5;
      const i = score?.impact ?? 1;
      const c = score?.confidence ?? 0.8;
      const e = score?.effort ?? 1;
      return { ...item, r, i, c, e, total: calcRiceScore(r, i, c, e) };
    }).sort((a, b) => b.total - a.total);
    
    toast({
      title: "Sucesso!",
      description: "Itens repriorizado com sucesso!",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RICE Score</h1>
          <p className="text-sm text-muted-foreground">Priorize tarefas e iniciativas com o framework RICE</p>
        </div>
        {Object.keys(pendingScores).length > 0 && (
          <Button onClick={handleSaveAndReprioritize} variant="default" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar e Repriorizar
            <Badge variant="secondary" className="ml-1">{Object.keys(pendingScores).length}</Badge>
          </Button>
        )}
      </div>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Calculator className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhum item para priorizar</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Crie tarefas no backlog ou iniciativas no roadmap</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-center font-medium">Reach</th>
                <th className="px-4 py-3 text-center font-medium">Impact</th>
                <th className="px-4 py-3 text-center font-medium">Confidence</th>
                <th className="px-4 py-3 text-center font-medium">Effort</th>
                <th className="px-4 py-3 text-center font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(item => (
                <tr key={item.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.type === 'task' ? 'Tarefa' : 'Iniciativa'}</td>
                  <td className="px-4 py-3 text-center">
                    <Input type="number" min={1} className="h-8 w-16 text-center mx-auto" value={getValue(item.id, 'reach', item.r)}
                      onChange={e => handleFieldChange(item.id, 'reach', Number(e.target.value))} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Select value={String(getValue(item.id, 'impact', item.i))} onValueChange={v => handleFieldChange(item.id, 'impact', Number(v))}>
                      <SelectTrigger className="h-8 w-24 mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{IMPACT_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Select value={String(getValue(item.id, 'confidence', item.c))} onValueChange={v => handleFieldChange(item.id, 'confidence', Number(v))}>
                      <SelectTrigger className="h-8 w-20 mx-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONFIDENCE_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Input type="number" min={0.5} step={0.5} className="h-8 w-16 text-center mx-auto" value={getValue(item.id, 'effort', item.e)}
                      onChange={e => handleFieldChange(item.id, 'effort', Number(e.target.value))} />
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold">{item.total.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RicePage;
