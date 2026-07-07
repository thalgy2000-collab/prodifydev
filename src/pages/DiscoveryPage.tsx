import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import ProblemStatementCard from '@/components/discovery/ProblemStatementCard';

export default function DiscoveryPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground flex items-center justify-center gap-2">
          <span>💎</span> Double Diamond Discovery
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Do entendimento do problema à solução validada
        </p>
      </header>

      {/* Diamonds visual */}
      <div className="mb-10 rounded-2xl border border-border bg-card p-6 md:p-10 overflow-x-auto">
        <DiamondsSVG />

        {/* Guiding questions row */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <Question color="text-blue-400" label="Descobrir" text="Quais são e de onde vem os problemas?" />
          <Question color="text-purple-400" label="Definir" text="Qual problema devemos focar em resolver?" />
          <Question color="text-orange-400" label="Desenvolver" text="Quais são as soluções possíveis?" />
          <Question color="text-emerald-400" label="Entregar" text="A nossa solução de fato resolve o problema?" />
        </div>
      </div>

      {/* CTA cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={() => navigate('/discovery/problema')}
          className="group text-left rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent p-6 md:p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-500/60"
        >
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>💙</span> Diamante 1
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Problema</h2>
          <p className="text-sm text-muted-foreground mb-5">
            "Quais são e de onde vem os problemas?" — entenda antes de resolver.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
            Explorar Problema
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>

        <button
          onClick={() => navigate('/discovery/solucao')}
          className="group text-left rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-emerald-500/5 to-transparent p-6 md:p-8 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-orange-500/60"
        >
          <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>🧡</span> Diamante 2
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Solução</h2>
          <p className="text-sm text-muted-foreground mb-5">
            "Quais são as soluções possíveis para o problema?" — explore e valide.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-orange-400">
            Explorar Solução
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    </div>
  );
}

function Question({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function DiamondsSVG() {
  // Two diamonds (rhombuses) side-by-side with a center value-prop star.
  // Diamond 1: blue (descobrir) + purple (definir)
  // Diamond 2: orange (desenvolver) + emerald (entregar)
  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 0 900 260"
        className="w-full max-w-4xl h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Diamond 1 — Problem */}
        <g>
          {/* Left half (Descobrir) */}
          <polygon points="50,130 230,40 230,220" fill="hsl(217 91% 60% / 0.18)" stroke="hsl(217 91% 60%)" strokeWidth="2" />
          {/* Right half (Definir) */}
          <polygon points="230,40 410,130 230,220" fill="hsl(262 83% 65% / 0.18)" stroke="hsl(262 83% 65%)" strokeWidth="2" />

          {/* Phase labels inside */}
          <text x="160" y="135" textAnchor="middle" className="fill-blue-300" fontSize="13" fontWeight="600">
            descobrir
          </text>
          <text x="305" y="135" textAnchor="middle" className="fill-purple-300" fontSize="13" fontWeight="600">
            definir
          </text>

          {/* Diagonal labels */}
          <text x="120" y="80" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10" transform="rotate(-26 120 80)">
            divergente
          </text>
          <text x="345" y="80" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10" transform="rotate(26 345 80)">
            convergente
          </text>

          {/* Bottom label */}
          <text x="230" y="248" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="12" fontWeight="600">
            Problema
          </text>
          <text x="230" y="20" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10">
            pesquisa · definição
          </text>
        </g>

        {/* Connector line */}
        <line x1="410" y1="130" x2="490" y2="130" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="4 4" />

        {/* Center value-prop badge */}
        <g>
          <circle cx="450" cy="130" r="22" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
          <text x="450" y="135" textAnchor="middle" fontSize="18">★</text>
          <text x="450" y="172" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="10" fontWeight="600">
            Proposta
          </text>
          <text x="450" y="184" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="10" fontWeight="600">
            de Valor
          </text>
        </g>

        {/* Diamond 2 — Solution */}
        <g>
          {/* Left half (Desenvolver) */}
          <polygon points="490,130 670,40 670,220" fill="hsl(38 92% 55% / 0.18)" stroke="hsl(38 92% 55%)" strokeWidth="2" />
          {/* Right half (Entregar) */}
          <polygon points="670,40 850,130 670,220" fill="hsl(160 84% 45% / 0.18)" stroke="hsl(160 84% 45%)" strokeWidth="2" />

          <text x="600" y="135" textAnchor="middle" className="fill-orange-300" fontSize="13" fontWeight="600">
            desenvolver
          </text>
          <text x="745" y="135" textAnchor="middle" className="fill-emerald-300" fontSize="13" fontWeight="600">
            entregar
          </text>

          <text x="560" y="80" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10" transform="rotate(-26 560 80)">
            divergente
          </text>
          <text x="785" y="80" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10" transform="rotate(26 785 80)">
            convergente
          </text>

          <text x="670" y="248" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="12" fontWeight="600">
            Solução
          </text>
          <text x="670" y="20" textAnchor="middle" fill="currentColor" className="text-muted-foreground" fontSize="10">
            ideação · validação
          </text>
        </g>
      </svg>
    </div>
  );
}
