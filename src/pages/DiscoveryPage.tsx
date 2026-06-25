import { useNavigate } from 'react-router-dom';
import { Search, Target, Lightbulb, CheckCircle2 } from 'lucide-react';

type Phase = {
  num: number;
  icon: string;
  title: string;
  label: string;
  color: string;
  bg: string;
  border: string;
};

const stages: Phase[] = [
  { num: 1, icon: '🔍', title: 'Descobrir', label: 'Divergir', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { num: 2, icon: '🎯', title: 'Definir', label: 'Convergir', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { num: 3, icon: '💡', title: 'Desenvolver', label: 'Divergir', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { num: 4, icon: '✅', title: 'Entregar', label: 'Convergir', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
];

interface FrameworkCard {
  icon: string;
  title: string;
  desc: string;
  route: string;
}

const phase1: FrameworkCard[] = [
  { icon: '🎤', title: 'Entrevistas com Usuários', desc: 'Registre insights de conversas com usuários reais', route: '/discovery/entrevistas' },
  { icon: '🏆', title: 'Análise de Concorrência', desc: 'Mapeie alternativas e concorrentes do mercado', route: '/concorrencia' },
  { icon: '📊', title: 'SWOT', desc: 'Analise forças, fraquezas, oportunidades e ameaças', route: '/swot' },
];

const phase2: FrameworkCard[] = [
  { icon: '👤', title: 'Personas', desc: 'Crie perfis dos seus usuários ideais', route: '/discovery/personas' },
  { icon: '🌳', title: 'Árvore de Oportunidades', desc: 'Mapeie oportunidades conectadas ao problema', route: '/oportunidades' },
];

const phase3: FrameworkCard[] = [
  { icon: '🧪', title: 'Hipóteses', desc: 'Formule e valide hipóteses de solução', route: '/discovery/hipoteses' },
];

const phase4: FrameworkCard[] = [
  { icon: '🖥️', title: 'Testes de Usabilidade', desc: 'Valide a solução com usuários reais', route: '/discovery/testes' },
];

export default function DiscoveryPage() {
  const navigate = useNavigate();

  const renderCards = (cards: FrameworkCard[], accent: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(c => (
        <button
          key={c.route}
          onClick={() => navigate(c.route)}
          className={`group rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${accent}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const PhaseSection = ({
    phaseNum,
    title,
    direction,
    desc,
    accentText,
    accentBg,
    accentBorder,
    cards,
    hoverBorder,
  }: {
    phaseNum: number;
    title: string;
    direction: string;
    desc: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    cards: FrameworkCard[];
    hoverBorder: string;
  }) => (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 p-3 rounded-lg ${accentBg} border ${accentBorder}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${accentBg} ${accentText} text-sm font-bold border ${accentBorder}`}>
          {phaseNum}
        </div>
        <div>
          <p className={`text-sm font-semibold ${accentText}`}>
            Fase {phaseNum} — {title} <span className="font-normal opacity-70">({direction})</span>
          </p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {renderCards(cards, hoverBorder)}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          Double Diamond Discovery
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Do problema à solução validada
        </p>
      </header>

      {/* Timeline */}
      <div className="mb-10 rounded-xl border border-border bg-card p-4 md:p-6">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {stages.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 min-w-fit">
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${s.bg} border ${s.border}`}>
                <span className="text-xl">{s.icon}</span>
                <span className={`text-xs font-semibold ${s.color} uppercase tracking-wide`}>
                  {s.title}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className="text-muted-foreground/40 text-lg">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Diamante 1 */}
      <section className="mb-10 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent p-5 md:p-6">
        <header className="mb-5">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <span>💎</span> Diamante 1 — Problema
          </h2>
          <p className="text-sm text-muted-foreground">Entenda o problema antes de pensar na solução</p>
        </header>

        <div className="space-y-6">
          <PhaseSection
            phaseNum={1}
            title="Descobrir"
            direction="Divergir"
            desc="Explore o espaço do problema sem filtros"
            accentText="text-blue-400"
            accentBg="bg-blue-500/10"
            accentBorder="border-blue-500/30"
            hoverBorder="hover:border-blue-500/60"
            cards={phase1}
          />
          <PhaseSection
            phaseNum={2}
            title="Definir"
            direction="Convergir"
            desc="Sintetize o que aprendeu e defina o problema central"
            accentText="text-purple-400"
            accentBg="bg-purple-500/10"
            accentBorder="border-purple-500/30"
            hoverBorder="hover:border-purple-500/60"
            cards={phase2}
          />
        </div>
      </section>

      {/* Diamante 2 */}
      <section className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-emerald-500/5 to-transparent p-5 md:p-6">
        <header className="mb-5">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <span>💎</span> Diamante 2 — Solução
          </h2>
          <p className="text-sm text-muted-foreground">Explore e valide soluções para o problema definido</p>
        </header>

        <div className="space-y-6">
          <PhaseSection
            phaseNum={3}
            title="Desenvolver"
            direction="Divergir"
            desc="Explore possíveis soluções sem julgamentos"
            accentText="text-orange-400"
            accentBg="bg-orange-500/10"
            accentBorder="border-orange-500/30"
            hoverBorder="hover:border-orange-500/60"
            cards={phase3}
          />
          <PhaseSection
            phaseNum={4}
            title="Entregar"
            direction="Convergir"
            desc="Teste e refine a solução com usuários reais"
            accentText="text-emerald-400"
            accentBg="bg-emerald-500/10"
            accentBorder="border-emerald-500/30"
            hoverBorder="hover:border-emerald-500/60"
            cards={phase4}
          />
        </div>
      </section>
    </div>
  );
}
