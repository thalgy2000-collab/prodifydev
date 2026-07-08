import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { DataAnalysis, DataAnalysisType } from '@/types/research';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, Link2, Trash2, LineChart } from 'lucide-react';
import { toast } from 'sonner';

export default function DataAnalysisTab({ onUpdate }: { onUpdate: () => void }) {
  const { activeProduct } = useProduct();
  const { user } = useAuth();
  const [data, setData] = useState<DataAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [analysisType, setAnalysisType] = useState<DataAnalysisType>('Analytics Geral');
  const [conclusions, setConclusions] = useState('');
  const [reportLink, setReportLink] = useState('');

  const fetchData = async () => {
    if (!activeProduct) return;
    setLoading(true);
    const { data: res, error } = await supabase
      .from('data_analysis')
      .select('*')
      .eq('product_id', activeProduct.id)
      .order('created_at', { ascending: false });
    
    if (!error && res) setData(res as unknown as DataAnalysis[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activeProduct]);

  const handleSubmit = async () => {
    if (!title.trim() || !activeProduct || !user) return;

    const { error } = await supabase.from('data_analysis').insert({
      product_id: activeProduct.id,
      user_id: user.id,
      title,
      data_source: dataSource,
      analysis_type: analysisType,
      conclusions,
      report_link: reportLink,
    });

    if (error) {
      toast.error('Erro ao salvar análise.');
      console.error(error);
    } else {
      toast.success('Análise criada!');
      setOpen(false);
      resetForm();
      fetchData();
      onUpdate();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta análise?')) return;
    const { error } = await supabase.from('data_analysis').delete().eq('id', id);
    if (!error) {
      fetchData();
      onUpdate();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDataSource('');
    setAnalysisType('Analytics Geral');
    setConclusions('');
    setReportLink('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Análises de Dados</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Análise</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Análise de Dados</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Título / Foco da Análise</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Queda no funil de checkout" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fonte de Dados</Label>
                  <Input value={dataSource} onChange={e => setDataSource(e.target.value)} placeholder="Ex: Mixpanel, Google Analytics" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Análise</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={analysisType} 
                    onChange={e => setAnalysisType(e.target.value as DataAnalysisType)}
                  >
                    <option value="Analytics Geral">Analytics Geral</option>
                    <option value="Análise de Coorte">Análise de Coorte</option>
                    <option value="Análise de Funil">Análise de Funil</option>
                    <option value="Heatmap">Heatmap</option>
                    <option value="Teste A/B">Teste A/B</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Principais Conclusões</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={conclusions} 
                  onChange={e => setConclusions(e.target.value)} 
                  placeholder="Resumo dos achados..."
                />
              </div>
              <div className="space-y-2">
                <Label>Link do Dashboard/Relatório</Label>
                <Input value={reportLink} onChange={e => setReportLink(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={handleSubmit} className="w-full mt-4" disabled={!title}>Salvar Análise</Button>
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
          Nenhuma análise de dados cadastrada.
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
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  {item.analysis_type}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3">
                <LineChart className="h-3.5 w-3.5" /> {item.data_source || 'Fonte não informada'}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
                {item.conclusions || 'Nenhuma conclusão adicionada.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                {item.report_link ? (
                  <a href={item.report_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1 w-full justify-end">

                    Abrir Dashboard <Link2 className="h-3 w-3" />
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
