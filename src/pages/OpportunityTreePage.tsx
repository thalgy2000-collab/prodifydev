import { useState } from 'react';
import { useOpportunityTreeStore } from '@/hooks/useOpportunityTreeStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import { OpportunityNode, OpportunityNodeType, NODE_TYPE_CONFIG } from '@/types/opportunityTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TreePine, Trash2 } from 'lucide-react';

const NodeCard = ({ node, children: childNodes, onAdd, onDelete }: {
  node: OpportunityNode;
  children: OpportunityNode[];
  onAdd: (parentId: string, objectiveId: string) => void;
  onDelete: (id: string) => void;
}) => {
  const cfg = NODE_TYPE_CONFIG[node.type];
  return (
    <div className="ml-4 border-l-2 border-border pl-4">
      <div className="group flex items-start gap-2 rounded-lg bg-card p-3 shadow-sm">
        <span className="text-lg">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{node.title}</span>
            <Badge variant="secondary" style={{ backgroundColor: `hsl(${cfg.color} / 0.15)`, color: `hsl(${cfg.color})` }} className="text-xs">{cfg.label}</Badge>
          </div>
          {node.description && <p className="mt-1 text-xs text-muted-foreground">{node.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdd(node.id, node.objectiveId)}><Plus className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(node.id)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
      {childNodes.map(child => (
        <NodeCard key={child.id} node={child} children={[]} onAdd={onAdd} onDelete={onDelete} />
      ))}
    </div>
  );
};

const OpportunityTreePage = () => {
  const { nodes, addNode, deleteNode, getNodesByObjective, getChildren } = useOpportunityTreeStore();
  const { objectives } = useOKRStore();

  const [selectedObjective, setSelectedObjective] = useState<string>('');
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

  const renderTree = (node: OpportunityNode): React.ReactNode => {
    const kids = getChildren(node.id);
    return (
      <div key={node.id}>
        <NodeCard node={node} children={kids} onAdd={openAddDialog} onDelete={deleteNode} />
        <div className="ml-4">{kids.map(renderTree)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
          <Button variant="outline" className="gap-2" onClick={() => openAddDialog(null, selectedObjective)}>
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
        <div className="space-y-2">{rootNodes.map(renderTree)}</div>
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
