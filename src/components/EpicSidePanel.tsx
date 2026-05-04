import { useState } from 'react';
import { Epic, EPIC_COLORS } from '@/types/epic';
import { useEpicStore } from '@/hooks/useEpicStore';
import { useBacklogStore } from '@/hooks/useBacklogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X, Layers, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EpicSidePanelProps {
  open: boolean;
  onClose: () => void;
  selectedEpicId: string | null;
  onSelectEpic: (id: string | null) => void;
}

const EpicSidePanel = ({ open, onClose, selectedEpicId, onSelectEpic }: EpicSidePanelProps) => {
  const { epics, addEpic, updateEpic, deleteEpic } = useEpicStore();
  const { tasks } = useBacklogStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Epic | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EPIC_COLORS[0]);

  const openCreate = () => {
    setEditing(null); setName(''); setDescription(''); setColor(EPIC_COLORS[0]);
    setEditorOpen(true);
  };

  const openEdit = (epic: Epic) => {
    setEditing(epic); setName(epic.name); setDescription(epic.description); setColor(epic.color);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe um nome'); return; }
    if (editing) {
      await updateEpic(editing.id, { name, description, color });
      toast.success('Épico atualizado');
    } else {
      await addEpic({ name, description, color });
      toast.success('Épico criado');
    }
    setEditorOpen(false);
  };

  const handleDelete = async (epic: Epic) => {
    if (!confirm(`Excluir o épico "${epic.name}"? As tarefas vinculadas serão desvinculadas.`)) return;
    await deleteEpic(epic.id);
    if (selectedEpicId === epic.id) onSelectEpic(null);
    toast.success('Épico excluído');
  };

  const countFor = (id: string | null) =>
    id === null ? tasks.length : tasks.filter(t => t.epicId === id).length;
  const noEpicCount = tasks.filter(t => !t.epicId).length;

  if (!open) return null;

  return (
    <>
      <aside className="fixed right-0 top-0 z-40 h-screen w-80 border-l border-border bg-card shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Épicos</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="gap-1.5 h-8" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Novo
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <button
            type="button"
            onClick={() => onSelectEpic(null)}
            className={cn(
              'w-full text-left rounded-md border p-3 transition-colors',
              selectedEpicId === null ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Todas as tarefas</span>
              <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectEpic('__none__')}
            className={cn(
              'w-full text-left rounded-md border p-3 transition-colors',
              selectedEpicId === '__none__' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-muted-foreground">Sem épico</span>
              <Badge variant="secondary" className="text-[10px]">{noEpicCount}</Badge>
            </div>
          </button>

          <div className="h-px bg-border my-2" />

          {epics.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum épico criado. Use "Novo" para começar.
            </p>
          ) : (
            epics.map(epic => {
              const isActive = selectedEpicId === epic.id;
              return (
                <div
                  key={epic.id}
                  className={cn(
                    'group rounded-md border p-3 transition-colors',
                    isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectEpic(epic.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: epic.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{epic.name}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {countFor(epic.id)}
                          </Badge>
                        </div>
                        {epic.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {epic.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(epic)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(epic)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar épico' : 'Novo épico'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Onboarding" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {EPIC_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center"
                    style={{ backgroundColor: c, borderColor: color === c ? 'hsl(var(--foreground))' : 'transparent' }}
                  >
                    {color === c && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? 'Salvar' : 'Criar épico'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EpicSidePanel;
