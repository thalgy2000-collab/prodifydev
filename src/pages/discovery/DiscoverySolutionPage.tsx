import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FrameworkCard, { FrameworkCardData } from '@/components/discovery/FrameworkCard';
import { useDiscoveryCounts } from '@/hooks/useDiscoveryCounts';

export default function DiscoverySolutionPage() {
  const navigate = useNavigate();
  const { data: counts } = useDiscoveryCounts();

  const desenvolver: FrameworkCardData[] = [
    {
      icon: '🧪',
      title: 'Hipóteses de Solução',
      desc: 'Formule e valide hipóteses para o problema.',
      route: '/discovery/hipoteses',
      count: counts?.hypotheses,
      countLabel: (n) => `${n} ${n === 1 ? 'hipótese' : 'hipóteses'}`,
    },
  ];

  const entregar: FrameworkCardData[] = [
    {
      icon: '🖥️',
      title: 'Testes de Usabilidade',
      desc: 'Valide a solução com usuários reais.',
      route: '/discovery/testes',
      count: counts?.usabilityTests,
      countLabel: (n) => `${n} ${n === 1 ? 'teste' : 'testes'}`,
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
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-1">💎 Diamante 2</p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Solução</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Explore e valide soluções para o problema definido
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Desenvolver */}
        <section className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">Divergir · Ideação</p>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>💡</span> Desenvolver
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Quais são as soluções possíveis?
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {desenvolver.map((c) => (
              <FrameworkCard key={c.route} data={c} accent="hover:border-orange-500/60" />
            ))}
          </div>
        </section>

        {/* Entregar */}
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <header className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Convergir · Validação</p>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mt-0.5">
              <span>✅</span> Entregar
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              A nossa solução de fato resolve o problema?
            </p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entregar.map((c) => (
              <FrameworkCard key={c.route} data={c} accent="hover:border-emerald-500/60" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
