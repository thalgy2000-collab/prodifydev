import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Rocket, BarChart3, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type SubItem = { title: string; url: string };
type NavCategory = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubItem[];
  /** When provided, tapping the icon navigates here directly (no sheet). */
  directUrl?: string;
};

const categories: NavCategory[] = [
  {
    key: 'visao-geral',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    directUrl: '/',
    items: [{ title: 'Visão Geral', url: '/' }],
  },
  {
    key: 'planejamento',
    label: 'Planejamento',
    icon: Target,
    items: [
      { title: 'OKRs', url: '/okrs' },
      { title: 'Roadmap', url: '/roadmap' },
      { title: 'Agenda do produto', url: '/produto-agenda' },
      { title: 'Oportunidades', url: '/oportunidades' },
      { title: 'SWOT', url: '/swot' },
      { title: 'Concorrência', url: '/concorrencia' },
      { title: 'RICE', url: '/rice' },
    ],
  },
  {
    key: 'delivery',
    label: 'Delivery',
    icon: Rocket,
    items: [
      { title: 'Backlog', url: '/backlog' },
      { title: 'Sprints', url: '/sprints' },
      { title: 'Histórico', url: '/historico' },
    ],
  },
  {
    key: 'analises',
    label: 'Análises',
    icon: BarChart3,
    directUrl: '/analises',
    items: [{ title: 'Análises', url: '/analises' }],
  },
  {
    key: 'membros',
    label: 'Membros',
    icon: Users,
    directUrl: '/membros',
    items: [{ title: 'Membros', url: '/membros' }],
  },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const isCategoryActive = (cat: NavCategory) =>
    cat.items.some(i =>
      i.url === '/' ? location.pathname === '/' : location.pathname.startsWith(i.url)
    );

  const handleTap = (cat: NavCategory) => {
    if (cat.directUrl) {
      navigate(cat.directUrl);
    } else {
      setOpenKey(cat.key);
    }
  };

  const activeCategory = categories.find(c => c.key === openKey) || null;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação principal"
      >
        <ul className="grid grid-cols-5">
          {categories.map(cat => {
            const Icon = cat.icon;
            const active = isCategoryActive(cat);
            return (
              <li key={cat.key}>
                <button
                  onClick={() => handleTap(cat)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 w-full h-14 text-[10px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label={cat.label}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-none">{cat.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Sheet open={!!activeCategory} onOpenChange={o => !o && setOpenKey(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          <SheetHeader>
            <SheetTitle className="text-left">{activeCategory?.label}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-1">
            {activeCategory?.items.map(item => {
              const active = item.url === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.url);
              return (
                <button
                  key={item.url}
                  onClick={() => {
                    navigate(item.url);
                    setOpenKey(null);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                  )}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default MobileBottomNav;
