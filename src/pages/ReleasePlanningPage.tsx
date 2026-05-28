import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { useUndo } from '@/contexts/UndoContext';
import { useReleaseStore } from '@/hooks/useReleaseStore';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { Release, RELEASE_STATUS_LABELS } from '@/types/release';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CountedInput } from '@/components/ui/counted-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Trash2, CalendarDays, Link2, X } from 'lucide-react';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { releasesTourSteps } from '@/lib/featureTours';

const statusColors: Record<Release['status'], string> = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/20 text-primary',
  released: 'bg-emerald-500/20 text-emerald-400',
};

const ReleasePlanningPage = () => {
  const { releases, addRelease, updateRelease, deleteRelease, addItemToRelease, removeItemFromRelease, getItemsForRelease, refresh } = useReleaseStore();
  const { items: roadmapItems } = useRoadmapStore();
  const { user } = useAuth();
  const { activeProduct } = useProduct();
  const { push, undoLast } = useUndo();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [plannedDate, setPlannedDate] = useState('');
  const [status, setStatus] = useState<Release['status']>('planned');

  const [linkOpen, setLinkOpen] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !plannedDate) return;
    await addRelease({ name: name.trim(), version: version.trim(), plannedDate, status });
    setName(''); setVersion('v1.0'); setPlannedDate(''); setStatus('planned');
    setOpen(false);
  };

  const handleDeleteRelease = async (release: typeof releases[number]) => {
    const snap = { ...release };
    const items = getItemsForRelease(release.id);
    await deleteRelease(release.id);
    push({
      description: `Release excluída: ${snap.name}`,
      undo: async () => {
        if (!user || !activeProduct) return;
        await (supabase.from('releases') as any).insert({
          id: snap.id, user_id: user.id, product_id: activeProduct.id,
          name: snap.name, version: snap.version, planned_date: snap.plannedDate, status: snap.status,
        });
        if (items.length) {
          await (supabase.from('release_items') as any).insert(
            items.map(it => ({ release_id: snap.id, roadmap_item_id: it.roadmapItemId }))
          );
        }
        await refresh();
      },
    });
    toast.success(`Release excluída: ${snap.name}`, {
      duration: 8000,
      action: { label: '↩ Desfazer', onClick: () => undoLast() },
    });
  };

  const { TourElement } = useFeatureTour('releases', releasesTourSteps);

  return (
    <div className="space-y-6">
      {TourElement}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Release Planning</h1>
          <p className="text-sm text-muted-foreground">Planeje e acompanhe suas releases</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-tour-feature="release-create" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Release
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Release</DialogTitle>
              <DialogDescription>Defina os detalhes da nova release</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <CountedInput maxLength={50} inline value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Launch MVP" />
              </div>
              <div>
                <Label>Versão</Label>
                <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="Ex: v1.0" />
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as Release['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejado</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="released">Lançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!name.trim() || !plannedDate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhuma release encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Crie sua primeira release</p>
        </div>
      ) : (
        <div data-tour-feature="release-list" className="space-y-4">
          {releases.map(release => {
            const linkedItems = getItemsForRelease(release.id);
            const linkedRoadmapItems = linkedItems.map(li => roadmapItems.find(ri => ri.id === li.roadmapItemId)).filter(Boolean);
            const unlinkedRoadmap = roadmapItems.filter(ri => !linkedItems.some(li => li.roadmapItemId === ri.id));

            return (
              <div key={release.id} data-tour-feature="release-card" className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Package className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">{release.name}</h3>
                        <Badge variant="outline" className="text-xs font-mono">{release.version}</Badge>
                        <Badge className={`text-xs ${statusColors[release.status]}`}>
                          {RELEASE_STATUS_LABELS[release.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(release.plannedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Select value={release.status} onValueChange={v => updateRelease(release.id, { status: v as Release['status'] })}>
                      <SelectTrigger className="h-7 w-[130px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planejado</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="released">Lançado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteRelease(release)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Linked initiatives */}
                <div data-tour-feature="release-items" className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Iniciativas vinculadas</p>
                  {linkedRoadmapItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60 italic">Nenhuma iniciativa vinculada</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {linkedRoadmapItems.map(item => item && (
                        <div key={item.id} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: item.color, opacity: 0.85 }}>
                          <Link2 className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{item.title}</span>
                          <button onClick={() => removeItemFromRelease(release.id, item.id)} className="ml-1 rounded hover:bg-white/20 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add initiative */}
                  {linkOpen === release.id ? (
                    <div className="flex flex-wrap gap-1.5 mt-1 p-2 rounded-lg border border-border/50 bg-muted/30">
                      {unlinkedRoadmap.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 italic">Todas iniciativas já vinculadas</p>
                      ) : (
                        unlinkedRoadmap.map(item => (
                          <button
                            key={item.id}
                            onClick={() => addItemToRelease(release.id, item.id)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white hover:brightness-110 transition-all"
                            style={{ backgroundColor: item.color, opacity: 0.7 }}
                          >
                            <Plus className="h-3 w-3" />
                            {item.title}
                          </button>
                        ))
                      )}
                      <button onClick={() => setLinkOpen(null)} className="text-xs text-muted-foreground hover:text-foreground ml-2">
                        Fechar
                      </button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setLinkOpen(release.id)}>
                      <Plus className="h-3 w-3" />
                      Vincular iniciativa
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReleasePlanningPage;
