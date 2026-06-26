import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FrameworkCard, { FrameworkCardData } from '@/components/discovery/FrameworkCard';
import { useDiscoveryCounts } from '@/hooks/useDiscoveryCounts';

export default function DiscoveryProblemPage() {
  const navigate = useNavigate();
  const { data: counts } = useDiscoveryCounts();

  const descobrir: FrameworkCardData[] = [
    {
      icon: '🎤',
      title: 'Entrevistas com Usuários',
      desc: 'Registre insights de conversas com usuários reais.',
      route: '/discovery/entrevistas',
      count: counts?.interviews,
      countLabel: (n) => `${n} ${n === 1 ? 'entrevista' : 'entrevistas'}`,
    },
    {
      icon: '🏆',
      title: 'Análise de Concorrência',
      desc: 'Mapeie alternativas e concorrentes do mercado.',
      route: '/concorrencia',
      count: counts?.competition,
      countLabel: (n) => `${n} ${n === 1 ? 'concorrente' : 'concorrentes'}`,
    },
    {
      icon: '📊',
      title: 'SWOT',
      desc: 'Analise forças, fraquezas, oportunidades e ameaças.',
      route: '/swot',
      count: counts?.swot,
      countLabel: (n) => `${n} ${n === 1 ? 'análise' : 'análises'}`,
    },
  ];

  const definir: FrameworkCardData[] = [
    {
      icon: '👤',
      title: 'Personas',
      desc: 'Crie perfis dos seus usuários ideais.',
      route: '/discovery/personas',
      count: counts?.personas,
      countLabel: (n) => `${n} ${n === 1 ? 'persona' : 'personas'}`,
    },
    {
      icon: '🌳',
      title: 'Árvore de Oportunidades',
      desc: 'Mapeie oportunidades conectadas ao problema.',
      route: '/oportunidades',
      count: counts?.opportunities,
      countLabel: (n) => `${n} ${n === 1 ? 'nó' : 'nós'}`,
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <button
        onClick={() => navigate('/discovery')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao Double Diamond
      </button>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">💎 Diamante 1</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Problema</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Entenda o problema antes de pensar na solução
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Descobrir */}
        <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Divergir · Pesquisa</p>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>🔍</span> Descobrir
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Quais são e de onde vem os problemas?
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {descobrir.map((c) => (
              <FrameworkCard key={c.route} data={c} accent="hover:border-blue-500/60" />
            ))}
          </div>
        </section>

        {/* Definir */}
        <section className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">Convergir · Definição</p>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>🎯</span> Definir
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Qual problema devemos focar em resolver?
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {definir.map((c) => (
              <FrameworkCard key={c.route} data={c} accent="hover:border-purple-500/60" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
