import { useState } from 'react';
import ProblemStatementBanner from '@/components/discovery/ProblemStatementBanner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { useUndo } from '@/contexts/UndoContext';
import { useSwotStore } from '@/hooks/useSwotStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import { SwotCategory, SWOT_CONFIG } from '@/types/swot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountedInput } from '@/components/ui/counted-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Shield } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { swotTourSteps } from '@/lib/featureTours';

const CATEGORIES: SwotCategory[] = ['strength', 'weakness', 'opportunity', 'threat'];

const SwotPage = () => {
  const { addItem, deleteItem, getByObjective, refresh } = useSwotStore();
  const { objectives } = useOKRStore();
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const { push, undoLast } = useUndo();

  const [scope, setScope] = useState<string>('global');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<SwotCategory>('strength');

  const objectiveId = scope === 'global' ? null : scope;
  const filtered = getByObjective(objectiveId);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    await addItem({ objectiveId, category: newCategory, content: newContent });
    setNewContent('');
  };

  const handleDelete = async (item: typeof filtered[number]) => {
    const snap = { ...item };
    await deleteItem(item.id);
    push({
      description: `Item SWOT excluído`,
      undo: async () => {
        if (!user || !activeProduct) return;
        await (supabase.from('swot_analyses') as any).insert({
          id: snap.id, user_id: user.id, product_id: activeProduct.id,
          objective_id: snap.objectiveId, category: snap.category, content: snap.content,
        });
        await refresh();
      },
    });
    toast.success('Item SWOT excluído', {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  };

  const { TourElement } = useFeatureTour('swot', swotTourSteps);

  return (
    <div data-tour-feature="swot-grid" className="space-y-6">
      <ProblemStatementBanner />
      {TourElement}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise SWOT</h1>
        <p className="text-sm text-muted-foreground">Avalie forças, fraquezas, oportunidades e ameaças</p>
      </div>

      {/* Scope selector */}
      <div className="flex items-center gap-3">
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="global">🌐 Visão Geral (Produto)</SelectItem>
            {objectives.map(o => <SelectItem key={o.id} value={o.id}>🎯 {o.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Add item row */}
      <div className="flex items-center gap-2">
        <Select value={newCategory} onValueChange={v => setNewCategory(v as SwotCategory)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{SWOT_CONFIG[c].icon} {SWOT_CONFIG[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CountedInput
          maxLength={200}
          inline
          placeholder="Descreva o item..."
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          containerClassName="flex-1"
        />
        <Button onClick={handleAdd} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map(cat => {
          const cfg = SWOT_CONFIG[cat];
          const catItems = filtered.filter(i => i.category === cat);
          return (
            <div
              key={cat}
              id={`swot-${cat}`}
              className="rounded-xl border-2 bg-card overflow-hidden"
              style={{ borderColor: `hsl(${cfg.color} / 0.4)` }}
            >
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: `hsl(${cfg.color} / 0.1)` }}
              >
                <span className="text-lg">{cfg.icon}</span>
                <h2 className="font-semibold text-sm" style={{ color: `hsl(${cfg.color})` }}>{cfg.label}</h2>
                <span className="ml-auto text-xs text-muted-foreground">{catItems.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[120px]">
                {catItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhum item adicionado</p>
                ) : (
                  catItems.map(item => (
                    <div key={item.id} className="group flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
                      <p className="flex-1 text-sm">{item.content}</p>
                      <button
                        onClick={() => handleDelete(item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 mt-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <Shield className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Comece adicionando itens à matriz SWOT</p>
        </div>
      )}
    </div>
  );
};

export default SwotPage;
