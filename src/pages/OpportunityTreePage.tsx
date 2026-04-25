import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOpportunityTreeStore } from '@/hooks/useOpportunityTreeStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import { OpportunityNode, OpportunityNodeType, NODE_TYPE_CONFIG } from '@/types/opportunityTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, TreePine, Trash2 } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { opportunityTourSteps } from '@/lib/featureTours';

const TreeNode = ({ node, getChildren, onAdd, onDelete }: {
  node: OpportunityNode;
  getChildren: (parentId: string) => OpportunityNode[];
  onAdd: (parentId: string, objectiveId: string) => void;
  onDelete: (id: string) => void;
}) => {
  const cfg = NODE_TYPE_CONFIG[node.type];
  const children = getChildren(node.id);

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className="group relative rounded-xl border-2 bg-card px-4 py-3 shadow-md transition-shadow hover:shadow-lg min-w-[180px] max-w-[240px]"
        style={{ borderColor: `hsl(${cfg.color})` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{cfg.icon}</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
            style={{
              backgroundColor: `hsl(${cfg.color} / 0.15)`,
              color: `hsl(${cfg.color})`,
            }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="font-medium text-sm leading-tight text-foreground">{node.title}</p>
        {node.description && (
          <p className="mt-1 text-xs text-muted-foreground leading-snug line-clamp-2">{node.description}</p>
        )}
        {/* Action buttons */}
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAdd(node.id, node.objectiveId)}
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Children with connecting lines */}
      {children.length > 0 && (
        <>
          {/* Vertical line down from parent */}
          <div className="w-px h-6 bg-border" />

          {/* Horizontal connector + children */}
          <div className="relative flex items-start">
            {/* Horizontal line spanning all children */}
            {children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(50% / ${children.length})`,
                  right: `calc(50% / ${children.length})`,
                }}
              />
            )}

            <div className="flex gap-6">
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical line down to child */}
                  <div className="w-px h-6 bg-border" />
                  <TreeNode
                    node={child}
                    getChildren={getChildren}
                    onAdd={onAdd}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const OpportunityTreePage = () => {
  const { nodes, addNode, deleteNode, getNodesByObjective, getChildren } = useOpportunityTreeStore();
  const { objectives } = useOKRStore();

  const [searchParams] = useSearchParams();
  const [selectedObjective, setSelectedObjective] = useState<string>('');

  useEffect(() => {
    const objId = searchParams.get('objectiveId');
    if (objId && objectives.some(o => o.id === objId)) {
      setSelectedObjective(objId);
    }
  }, [searchParams, objectives]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<OpportunityNodeType>('outcome');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newObjectiveId, setNewObjectiveId] = useState('');

  const openAddDialog = (parentId: string | null, objectiveId: string) => {
    setNewParentId(parentId);
    setNewObjectiveId(objectiveId);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newObjectiveId) return;
    await addNode({ objectiveId: newObjectiveId, parentId: newParentId, type: newType, title: newTitle, description: newDesc });
    setNewTitle(''); setNewDesc(''); setNewType('outcome'); setCreateOpen(false);
  };

  const objNodes = selectedObjective ? getNodesByObjective(selectedObjective) : [];
  const rootNodes = objNodes.filter(n => !n.parentId);

  const { TourElement } = useFeatureTour('oportunidades', opportunityTourSteps);

  return (
    <div data-tour-feature="opp-tree" className="space-y-6">
      {TourElement}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Árvore de Oportunidades</h1>
          <p className="text-sm text-muted-foreground">Mapeie oportunidades, soluções e experimentos</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedObjective} onValueChange={setSelectedObjective}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Selecione um objetivo" /></SelectTrigger>
          <SelectContent>
            {objectives.map(o => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedObjective && (
          <Button data-tour-feature="opp-add" variant="outline" className="gap-2" onClick={() => openAddDialog(null, selectedObjective)}>
            <Plus className="h-4 w-4" />Adicionar Nó
          </Button>
        )}
      </div>

      {!selectedObjective ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <TreePine className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Selecione um objetivo para ver a árvore</p>
        </div>
      ) : rootNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <TreePine className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhum nó encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Adicione o primeiro nó à árvore</p>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-10 justify-center py-8 px-4 min-w-fit">
            {rootNodes.map(node => (
              <TreeNode
                key={node.id}
                node={node}
                getChildren={getChildren}
                onAdd={openAddDialog}
                onDelete={deleteNode}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Nó</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={newType} onValueChange={v => setNewType(v as OpportunityNodeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(NODE_TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Título</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} /></div>
            <Button onClick={handleCreate} className="w-full">Criar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OpportunityTreePage;
