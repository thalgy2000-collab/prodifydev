import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, MessageCircle, LineChart, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProduct } from '@/contexts/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import QuantitativeTab from '@/components/research/QuantitativeTab';
import QualitativeTab from '@/components/research/QualitativeTab';
import DataAnalysisTab from '@/components/research/DataAnalysisTab';
import DeskResearchTab from '@/components/research/DeskResearchTab';

export default function ResearchesPage() {
  const navigate = useNavigate();
  const { activeProduct } = useProduct();
  
  const [counts, setCounts] = useState({
    quantitative: 0,
    qualitative: 0,
    dataAnalysis: 0,
    deskResearch: 0,
  });

  const fetchCounts = async () => {
    if (!activeProduct) return;
    try {
      const [{ count: qtt }, { count: qlt }, { count: dt }, { count: dr }] = await Promise.all([
        supabase.from('quantitative_research').select('*', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
        supabase.from('qualitative_research').select('*', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
        supabase.from('data_analysis').select('*', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
        supabase.from('desk_research').select('*', { count: 'exact', head: true }).eq('product_id', activeProduct.id),
      ]);
      setCounts({
        quantitative: qtt || 0,
        qualitative: qlt || 0,
        dataAnalysis: dt || 0,
        deskResearch: dr || 0,
      });
    } catch (e) {
      console.error('Error fetching research counts:', e);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [activeProduct]);

  if (!activeProduct) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <button
        onClick={() => navigate('/discovery/problema')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Problema (Diamante 1)
      </button>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">🔍 Pesquisas</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Colete evidências</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Gerencie pesquisas quantitativas, qualitativas, análise de dados e desk research.
        </p>
      </header>

      {/* Dashboard Top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
            <BarChart2 className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.quantitative}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Quantitativas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
            <MessageCircle className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.qualitative}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Qualitativas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
            <LineChart className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.dataAnalysis}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Análise de Dados</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.deskResearch}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Desk Research</p>
        </div>
      </div>

      <Tabs defaultValue="quantitative" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="quantitative" className="flex-1 rounded-lg">📊 Quantitativa</TabsTrigger>
          <TabsTrigger value="qualitative" className="flex-1 rounded-lg">🎤 Qualitativa</TabsTrigger>
          <TabsTrigger value="data" className="flex-1 rounded-lg">📈 Dados</TabsTrigger>
          <TabsTrigger value="desk" className="flex-1 rounded-lg">📚 Desk Research</TabsTrigger>
        </TabsList>
        <TabsContent value="quantitative" className="mt-0 outline-none">
          <QuantitativeTab onUpdate={fetchCounts} />
        </TabsContent>
        <TabsContent value="qualitative" className="mt-0 outline-none">
          <QualitativeTab onUpdate={fetchCounts} />
        </TabsContent>
        <TabsContent value="data" className="mt-0 outline-none">
          <DataAnalysisTab onUpdate={fetchCounts} />
        </TabsContent>
        <TabsContent value="desk" className="mt-0 outline-none">
          <DeskResearchTab onUpdate={fetchCounts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
