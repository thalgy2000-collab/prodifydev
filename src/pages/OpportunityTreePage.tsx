import { useState, useEffect, useRef, useCallback, Component, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOpportunityTreeStore } from '@/hooks/useOpportunityTreeStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import { OpportunityNode, OpportunityNodeType, NODE_TYPE_CONFIG } from '@/types/opportunityTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Minus, TreePine, Trash2, Pencil, Maximize2 } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { opportunityTourSteps } from '@/lib/featureTours';

const ZOOM_KEY = 'opportunity_zoom';
const ZOOM_MIN = 50;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;

// Map legacy/Portuguese type values to canonical keys
const TYPE_ALIASES: Record<string, OpportunityNodeType> = {
  problema: 'outcome',
  problem: 'outcome',
  oportunidade: 'opportunity',
  solucao: 'solution',
  'solução': 'solution',
  experimento: 'experiment',
  metrica: 'outcome',
  'métrica': 'outcome',
};

const resolveType = (t: string | undefined | null): OpportunityNodeType => {
  if (!t) return 'opportunity';
  if ((NODE_TYPE_CONFIG as Record<string, unknown>)[t]) return t as OpportunityNodeType;
  return TYPE_ALIASES[t.toLowerCase()] ?? 'opportunity';
};

class TreeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('OpportunityTree error:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <TreePine className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Erro ao carregar a árvore</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Tente selecionar outro objetivo.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const TreeNode = ({ node, getChildren, onAdd, onEdit, onDelete }: {
  node: OpportunityNode;
  getChildren: (parentId: string) => OpportunityNode[];
  onAdd: (parentId: string, objectiveId: string) => void;
  onEdit: (node: OpportunityNode) => void;
  onDelete: (id: string) => void;
}) => {
  if (!node || !node.id) return null;
  const safeType = resolveType(node.type);
  const cfg = NODE_TYPE_CONFIG[safeType];
  const children = (getChildren(node.id) || []).filter(c => c && c.id);

  return (
    <div className="flex flex-col items-center">
      <div
        className="group relative rounded-xl border-2 bg-card px-4 py-3 shadow-md transition-shadow hover:shadow-lg min-w-[180px] max-w-[240px] cursor-pointer"
        style={{ borderColor: `hsl(${cfg.color})` }}
        onClick={() => onEdit(node)}
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
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            title="Editar"
            className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(node.id, node.objectiveId); }}
            title="Adicionar filho"
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
            title="Excluir"
            className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {children.length > 0 && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="relative flex items-start">
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
                  <div className="w-px h-6 bg-border" />
                  <TreeNode
                    node={child}
                    getChildren={getChildren}
                    onAdd={onAdd}
                    onEdit={onEdit}
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
  const { nodes, addNode, updateNode, deleteNode, getNodesByObjective, getChildren } = useOpportunityTreeStore();
  const { objectives } = useOKRStore();

  const [searchParams] = useSearchParams();
  const [selectedObjective, setSelectedObjective] = useState<string>('');

  useEffect(() => {
    const objId = searchParams.get('objectiveId');
    if (objId && objectives.some(o => o.id === objId)) {
      setSelectedObjective(objId);
    }
  }, [searchParams, objectives]);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<OpportunityNodeType>('outcome');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newObjectiveId, setNewObjectiveId] = useState('');

  // Edit dialog
  const [editingNode, setEditingNode] = useState<OpportunityNode | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<OpportunityNodeType>('outcome');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Zoom
  const [zoom, setZoom] = useState<number>(() => {
    const stored = localStorage.getItem(ZOOM_KEY);
    const v = stored ? parseInt(stored, 10) : 100;
    return isNaN(v) ? 100 : Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
  });

  useEffect(() => {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  }, [zoom]);

  const setZoomClamped = useCallback((v: number) => {
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(v))));
  }, []);

  const openAddDialog = (parentId: string | null, objectiveId: string) => {
    setNewParentId(parentId);
    setNewObjectiveId(objectiveId);
    setNewTitle(''); setNewDesc(''); setNewType('outcome');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newObjectiveId) return;
    await addNode({ objectiveId: newObjectiveId, parentId: newParentId, type: newType, title: newTitle, description: newDesc });
    setNewTitle(''); setNewDesc(''); setNewType('outcome'); setCreateOpen(false);
  };

  const openEditDialog = (node: OpportunityNode) => {
    setEditingNode(node);
    setEditTitle(node.title);
    setEditDesc(node.description || '');
    setEditType(node.type);
  };

  const handleSaveEdit = async () => {
    if (!editingNode || !editTitle.trim()) return;
    await updateNode(editingNode.id, { title: editTitle, description: editDesc, type: editType });
    setEditingNode(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await deleteNode(deleteId);
    setDeleteId(null);
  };

  // Pinch-to-zoom (mobile)
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(100);

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoomClamped(zoom + delta);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoom;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchDistRef.current;
      setZoomClamped(pinchStartZoomRef.current * ratio);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchDistRef.current = null;
  };

  const objNodes = (selectedObjective ? getNodesByObjective(selectedObjective) : []).filter(n => n && n.id && n.title);
  const rootNodes = objNodes.filter(n => !n.parentId);

  const { TourElement } = useFeatureTour('oportunidades', opportunityTourSteps);

  return (
    <div data-tour-feature="opp-tree" className="space-y-6 relative">
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
        <div
          ref={containerRef}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative"
        >
          <ScrollArea className="w-full">
            <TreeErrorBoundary>
              <div
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div className="flex gap-10 justify-center py-8 px-4 min-w-fit">
                  {rootNodes.map(node => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      getChildren={getChildren}
                      onAdd={openAddDialog}
                      onEdit={openEditDialog}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  ))}
                </div>
              </div>
            </TreeErrorBoundary>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Zoom controls */}
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1 rounded-full border border-border bg-background/80 backdrop-blur px-2 py-1 shadow-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoomClamped(zoom - ZOOM_STEP)} title="Diminuir zoom">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground tabular-nums w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoomClamped(zoom + ZOOM_STEP)} title="Aumentar zoom">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setZoomClamped(100)} title="Resetar zoom">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
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
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} /></div>
            <Button onClick={handleCreate} className="w-full">Criar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingNode} onOpenChange={(o) => !o && setEditingNode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Nó</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={editType} onValueChange={v => setEditType(v as OpportunityNodeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(NODE_TYPE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Título</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingNode(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSaveEdit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nó?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os subnós filhos também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OpportunityTreePage;
