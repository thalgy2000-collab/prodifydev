import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeskResearch, DeskResearchCategory } from '@/types/research';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Link2, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function DeskResearchTab({ onUpdate }: { onUpdate: () => void }) {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [data, setData] = useState<DeskResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [sourceAuthor, setSourceAuthor] = useState('');
  const [category, setCategory] = useState<DeskResearchCategory>('Artigo');
  const [url, setUrl] = useState('');
  const [relevance, setRelevance] = useState('');

  const fetchData = async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data: res, error } = await supabase
      .from('desk_research')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('created_at', { ascending: false });
    
    if (!error && res) setData(res as unknown as DeskResearch[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeProduct]);

  const handleSubmit = async () => {
    if (!title.trim() || !activeProduct || !user) return;

    const { error } = await supabase.from('desk_research').insert({
      product_id: activeProduct.id,
      user_id: user.id,
      title,
      source_author: sourceAuthor,
      category,
      url,
      relevance,
    });

    if (error) {
      toast.error('Erro ao salvar pesquisa.');
      console.error(error);
    } else {
      toast.success('Desk Research criado!');
      setOpen(false);
      resetForm();
      fetchData();
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta pesquisa?')) return;
    const { error } = await supabase.from('desk_research').delete().eq('id', id);
    if (!error) {
      fetchData();
      onUpdate();
    }
  };

  const resetForm = () => {
    setTitle('');
    setSourceAuthor('');
    setCategory('Artigo');
    setUrl('');
    setRelevance('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Desk Research</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Registro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md h-[90vh] sm:h-[85vh] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
              <DialogTitle>Novo Desk Research</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 space-y-4">
              <div className="space-y-2">
                <Label>Título / Assunto Principal</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Tendências do mercado SaaS 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fonte / Autor</Label>
                  <Input value={sourceAuthor} onChange={e => setSourceAuthor(e.target.value)} placeholder="Ex: Gartner, Medium" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={category} 
                    onChange={e => setCategory(e.target.value as DeskResearchCategory)}
                  >
                    <option value="Artigo">Artigo</option>
                    <option value="Relatório">Relatório</option>
                    <option value="Case Study">Case Study</option>
                    <option value="Benchmark">Benchmark</option>
                    <option value="Tendência de Mercado">Tendência de Mercado</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Relevância / Resumo</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={relevance} 
                  onChange={e => setRelevance(e.target.value)} 
                  placeholder="Por que isso é relevante para o produto?"
                />
              </div>
              <div className="space-y-2">
                <Label>Link do Material</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 shrink-0 border-t border-border/50 bg-background">
              <Button onClick={handleSubmit} className="w-full" disabled={!title}>Salvar Material</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground">
          Nenhum Desk Research cadastrado.
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
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                  {item.category}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3">
                <Globe className="h-3.5 w-3.5" /> {item.source_author || 'Fonte desconhecida'}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
                {item.relevance || 'Nenhuma nota de relevância adicionada.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1 w-full justify-end">
                    Ler Material <Link2 className="h-3 w-3" />
                  </a>
                ) : (
                  <div className="text-xs text-transparent">Sem link</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
