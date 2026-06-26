import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface FrameworkCardData {
  icon: string;
  title: string;
  desc: string;
  route: string;
  count?: number;
  countLabel?: (n: number) => string;
}

export default function FrameworkCard({
  data,
  accent,
}: {
  data: FrameworkCardData;
  accent: string; // tailwind hover border + ring class
}) {
  const navigate = useNavigate();
  const n = data.count ?? 0;
  const label = data.countLabel ? data.countLabel(n) : `${n} ${n === 1 ? 'registro' : 'registros'}`;

  return (
    <button
      onClick={() => navigate(data.route)}
      className={`group flex flex-col h-full rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${accent}`}
    >
      <span className="text-3xl leading-none mb-3">{data.icon}</span>
      <h3 className="font-semibold text-sm text-foreground mb-1">{data.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{data.desc}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
