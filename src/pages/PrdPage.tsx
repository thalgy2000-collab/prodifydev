import { useEffect, useState } from 'react';
import { usePrdStore } from '@/hooks/usePrdStore';
import { PRD } from '@/types/prd';
import { EditPrdDialog } from '@/components/EditPrdDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { prdTourSteps } from '@/lib/featureTours';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  in_review: { label: 'Em revisão', variant: 'outline' },
  approved: { label: 'Aprovado', variant: 'default' },
};

export default function PrdPage() {
  const { prds, loading, fetch, create, update, remove } = usePrdStore();
  const [editPrd, setEditPrd] = useState<PRD | null>(null);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    const prd = await create();
    if (prd) setEditPrd(prd);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PRD</h1>
        <Button onClick={handleCreate} className="gap-1">
          <Plus className="h-4 w-4" /> Novo PRD
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Carregando...</p>}

      {!loading && prds.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Nenhum PRD criado ainda.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prds.map(prd => {
          const cfg = statusConfig[prd.status] || statusConfig.draft;
          return (
            <Card
              key={prd.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setEditPrd(prd)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold truncate">{prd.title || 'Sem título'}</h3>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{prd.version}</span>
                  <span>•</span>
                  <span>{format(new Date(prd.updatedAt), "dd MMM yyyy", { locale: ptBR })}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EditPrdDialog
        prd={editPrd}
        open={!!editPrd}
        onOpenChange={open => { if (!open) setEditPrd(null); }}
        onUpdate={update}
        onDelete={async (id) => { await remove(id); setEditPrd(null); }}
      />
    </div>
  );
}
