import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProduct } from '@/contexts/ProductContext';
import { ArrowRight, Search, FileText } from 'lucide-react';

export default function ResearchesPreviewCard() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  const [total, setTotal] = useState(0);
  const [previews, setPreviews] = useState<{ id: string; title: string; type: string }[]>([]);

  useEffect(() => {
    async function fetchPreview() {
      if (!activeProduct) return;
      
      // Fetch totals
      const [qnt, qlt, dt, dr] = await Promise.all([
        supabase.from('quantitative_research').select('id', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
        supabase.from('qualitative_research').select('id', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
        supabase.from('data_analysis').select('id', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
        supabase.from('desk_research').select('id', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
      ]);
      
      const sum = (qnt.count || 0) + (qlt.count || 0) + (dt.count || 0) + (dr.count || 0);
      setTotal(sum);

      // Fetch 2 most recent from quali/quanti
      const { data: qltData } = await supabase
        .from('qualitative_research')
        .select('id, title, created_at')
        .eq('product_id', activeProduct.id)
        .order('created_at', { ascending: false })
        .limit(2);
        
      const { data: qntData } = await supabase
        .from('quantitative_research')
        .select('id, title, created_at')
        .eq('product_id', activeProduct.id)
        .order('created_at', { ascending: false })
        .limit(2);

      const combined = [
        ...(qltData || []).map(d => ({ ...d, type: 'Qualitativa' })),
        ...(qntData || []).map(d => ({ ...d, type: 'Quantitativa' }))
      ];
      
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPreviews(combined.slice(0, 2));
    }
    
    fetchPreview();
  }, [activeProduct]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-blue-500/20 bg-card p-5 text-left shadow-sm transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Search className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-foreground">Pesquisas</h3>
          <p className="text-xs text-muted-foreground">{total} {total === 1 ? 'pesquisa total' : 'pesquisas totais'}</p>
        </div>
      </div>
      
      <div className="flex-1 space-y-2 mb-5">
        {previews.length > 0 ? (
          previews.map(p => (
            <div key={p.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded-md px-3 py-2 border border-border/50">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="truncate">
                <span className="font-medium text-foreground">{p.title}</span>
                <span className="text-xs text-muted-foreground ml-2">({p.type})</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic py-2">
            Nenhuma pesquisa recente
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigate('/discovery/pesquisas')}
        className="mt-auto flex items-center justify-between text-sm font-medium text-blue-500 hover:text-blue-400 group/btn bg-blue-500/5 hover:bg-blue-500/10 px-4 py-2 rounded-lg transition-colors"
      >
        <span>Ver todas as pesquisas</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
      </button>
    </div>
  );
}
