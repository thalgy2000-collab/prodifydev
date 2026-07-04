import { useNavigate } from 'react-router-dom';
import { useFrequentPages } from '@/hooks/useFrequentPages';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const first = name?.split(' ')[0] || '';
  if (hour >= 6 && hour < 12) return `☀️ Bom dia, ${first}! Continue de onde parou`;
  if (hour >= 12 && hour < 18) return `👋 Boa tarde! Continue de onde parou`;
  if (hour >= 18 && hour < 23) return `🌙 Boa noite, ${first}! Acesso rápido`;
  return '⚡ Acesso Rápido';
}

export default function QuickAccess() {
  const navigate = useNavigate();
  const { pages, loading, isDefault } = useFrequentPages(4);
  const { profile } = useProfile();

  const greeting = getGreeting(profile?.displayName || profile?.fullName);

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">{greeting}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 animate-pulse"
            >
              <div className="w-8 h-8 rounded-lg bg-muted mb-3" />
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-3 w-14 bg-muted/60 rounded mb-3" />
              <div className="h-3 w-16 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{greeting}</h2>
        {isDefault && (
          <span className="text-xs text-muted-foreground italic">
            Comece explorando estas abas
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pages.map((item) => (
          <button
            key={item.page}
            onClick={() => navigate(item.page)}
            className={cn(
              'group flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left',
              'transition-all duration-200 cursor-pointer',
              'hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            <span className="text-[32px] leading-none mb-3 transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            <h3 className="text-sm font-bold text-foreground mb-0.5 truncate w-full">
              {item.label}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-3">
              {item.category}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-auto">
              {item.count > 0
                ? `${item.count} ${item.count === 1 ? 'visita' : 'visitas'}`
                : 'Explorar'}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
