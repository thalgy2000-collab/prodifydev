import { useState } from 'react';
import { useRoadmapStore } from '@/hooks/useRoadmapStore';
import { useOKRStore } from '@/hooks/useOKRStore';
import RoadmapCard from '@/components/RoadmapCard';
import CreateRoadmapDialog from '@/components/CreateRoadmapDialog';
import EditRoadmapDialog from '@/components/EditRoadmapDialog';
import { getCurrentQuarter, getQuarters, getQuarterMonths, getCategoryConfig } from '@/types/okr';
import { RoadmapItem } from '@/types/roadmap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RoadmapPage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const quarters = getQuarters(currentYear);
  const months = getQuarterMonths(selectedQuarter);

  const { items, addItem, updateStatus, updateItem, deleteItem, getByQuarter } = useRoadmapStore();
  const { objectives } = useOKRStore();

  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const filtered = getByQuarter(selectedQuarter);

  const getItemsByMonth = (monthIndex: number) =>
    filtered.filter(i => monthIndex >= i.startMonth && monthIndex <= i.endMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
          <p className="text-sm text-muted-foreground">Planeje e acompanhe suas iniciativas</p>
        </div>
        <CreateRoadmapDialog quarter={selectedQuarter} objectives={objectives} onAdd={addItem} />
      </div>

      <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          {quarters.map(q => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Map className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Nenhuma iniciativa encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Crie sua primeira iniciativa para este trimestre</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {months.map((month, mIdx) => (
            <div key={month} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{month}</h2>
              <div className="space-y-3">
                {getItemsByMonth(mIdx).map(item => (
                  <div key={item.id} className="relative">
                    <RoadmapCard
                      item={item}
                      objective={objectives.find(o => o.id === item.objectiveId)}
                      onUpdateStatus={updateStatus}
                      onDelete={deleteItem}
                    />
                    <Button
                      variant="ghost" size="icon"
                      className="absolute right-10 top-3 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                {getItemsByMonth(mIdx).length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground/50">Sem iniciativas</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editItem && (
        <EditRoadmapDialog
          item={editItem}
          objectives={objectives}
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          onSave={updateItem}
        />
      )}
    </div>
  );
};

export default RoadmapPage;
