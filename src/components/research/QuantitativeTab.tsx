import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { QuantitativeResearch, ResearchStatus } from '@/types/research';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuantitativeTab({ onUpdate }: { onUpdate: () => void }) {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [data, setData] = useState<QuantitativeResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [tool, setTool] = useState('');
  const [link, setLink] = useState('');
  const [totalResponses, setTotalResponses] = useState('');
  const [status, setStatus] = useState<ResearchStatus>('draft');

  const fetchData = async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data: res, error } = await supabase
      .from('quantitative_research')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('created_at', { ascending: false });
    
    if (!error && res) setData(res as QuantitativeResearch[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeProduct]);

  const handleSubmit = async () => {
    if (!title.trim() || !activeProduct || !user) return;

    const { error } = await supabase.from('quantitative_research').insert({
      product_id: activeProduct.id,
      user_id: user.id,
      title,
      objective,
      tool,
      link,
      total_responses: parseInt(totalResponses) || 0,
      status,
    });

    if (error) {
      toast.error('Erro ao salvar pesquisa.');
      console.error(error);
    } else {
      toast.success('Pesquisa criada com sucesso!');
      setOpen(false);
      resetForm();
      fetchData();
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta pesquisa?')) return;
    const { error } = await supabase.from('quantitative_research').delete().eq('id', id);
    if (!error) {
      fetchData();
      onUpdate();
    }
  };

  const resetForm = () => {
    setTitle('');
    setObjective('');
    setTool('');
    setLink('');
    setTotalResponses('');
    setStatus('draft');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Pesquisas Quantitativas</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Pesquisa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Pesquisa Quantitativa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pesquisa de Satisfação (NPS)" />
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="O que queremos descobrir?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ferramenta</Label>
                  <Input value={tool} onChange={e => setTool(e.target.value)} placeholder="Ex: Google Forms" />
                </div>
                <div className="space-y-2">
                  <Label>Total de Respostas</Label>
                  <Input type="number" value={totalResponses} onChange={e => setTotalResponses(e.target.value)} placeholder="Ex: 150" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={status} 
                  onChange={e => setStatus(e.target.value as ResearchStatus)}
                >
                  <option value="draft">Rascunho</option>
                  <option value="active">Ativa</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Link do Formulário / Resultados</Label>
                <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={handleSubmit} className="w-full mt-4">Salvar Pesquisa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground">
          Nenhuma pesquisa quantitativa cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(item => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5 relative group transition-all hover:border-primary/50">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-2 items-center mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                  item.status === 'active' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {item.status === 'completed' ? 'Concluída' : item.status === 'active' ? 'Ativa' : 'Rascunho'}
                </span>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                  {item.tool || 'Sem ferramenta'}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                {item.objective || 'Nenhum objetivo definido.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm font-medium">
                  {item.total_responses || 0} respostas
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                    Acessar <Link2 className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
