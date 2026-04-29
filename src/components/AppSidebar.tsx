import { useEffect, useState } from 'react';
import { Target, BarChart3, Calculator, LogOut, Moon, Sun, Shield, ArrowLeft, Check, LayoutDashboard, Compass, Rocket, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Item = { title: string; url: string; tourId?: string };
type Group = { label: string; icon?: typeof Target; emoji?: string; items: Item[]; tourKey: string; slug: string };

const groups: Group[] = [
  {
    label: 'Planejamento',
    icon: Target,
    tourKey: 'planejamento',
    slug: 'planejamento',
    items: [
      { title: 'OKRs', url: '/okrs', tourId: 'okrs' },
      { title: 'Roadmap', url: '/roadmap', tourId: 'roadmap' },
      { title: 'Release Planning', url: '/releases' },
      { title: 'PRD', url: '/prd' },
      { title: 'Agenda', url: '/produto-agenda' },
    ],
  },
  {
    label: 'Discovery',
    icon: Compass,
    tourKey: 'discovery',
    slug: 'discovery',
    items: [
      { title: 'Oportunidades', url: '/oportunidades' },
      { title: 'Concorrência', url: '/concorrencia' },
      { title: 'SWOT', url: '/swot' },
    ],
  },
  {
    label: 'Priorização',
    icon: Calculator,
    tourKey: 'priorizacao',
    slug: 'priorizacao',
    items: [{ title: 'RICE', url: '/rice' }],
  },
  {
    label: 'Delivery',
    icon: Rocket,
    tourKey: 'delivery',
    slug: 'delivery',
    items: [
      { title: 'Backlog', url: '/backlog', tourId: 'backlog' },
      { title: 'Sprints', url: '/sprints', tourId: 'sprints' },
      { title: 'Histórico', url: '/historico' },
    ],
  },
  {
    label: 'Análises',
    icon: BarChart3,
    tourKey: 'analises',
    slug: 'analises',
    items: [{ title: 'Análises', url: '/analises' }],
  },
  {
    label: 'Membros',
    emoji: '👥',
    tourKey: 'membros',
    slug: 'membros',
    items: [{ title: 'Membros', url: '/membros' }],
  },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { activeProduct, setActiveProductId, products } = useProduct();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_expanded') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_expanded', String(expanded));
    } catch {}
  }, [expanded]);

  const isGroupActive = (g: Group) =>
    location.pathname === `/categoria/${g.slug}` || g.items.some(i => location.pathname === i.url);
  const isActive = (path: string) => location.pathname === path;

  const renderGroupIcon = (group: Group, active: boolean) => {
    if (group.emoji) {
      return <span className="text-lg leading-none">{group.emoji}</span>;
    }
    const Icon = group.icon!;
    return <Icon className="h-5 w-5" />;
  };

  return (
      <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'h-screen sticky top-0 shrink-0 border-r border-border bg-card flex flex-col items-stretch py-2 gap-2 z-30 relative',
          'transition-[width] duration-200 ease-in-out',
          expanded ? 'w-52' : 'w-14'
        )}
        >
        {/* Toggle button on right edge */}
        <button
          onClick={() => setExpanded(v => !v)}
          aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
          className="absolute -right-3 top-4 z-40 h-6 w-6 rounded-full border border-border bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          {expanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Product switcher */}
        {activeProduct && (
          <div className={cn('flex', expanded ? 'px-2' : 'justify-center')}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'h-10 rounded-lg flex items-center gap-2 hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                    expanded ? 'w-full px-2' : 'w-10 justify-center'
                  )}
                  title={activeProduct.name}
                  aria-label="Trocar produto"
                >
                  <span className="text-xl leading-none">{activeProduct.emoji}</span>
                  {expanded && (
                    <span className="truncate text-sm font-medium text-foreground">{activeProduct.name}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-[240px]">
                <DropdownMenuItem onClick={() => setActiveProductId(null)} className="cursor-pointer text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao portfólio
                </DropdownMenuItem>
                <div className="h-px bg-border my-1" />
                {products.map(product => (
                  <DropdownMenuItem
                    key={product.id}
                    onClick={() => setActiveProductId(product.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-base">{product.emoji}</span>
                    <span className="truncate flex-1">{product.name}</span>
                    {product.id === activeProduct.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className={cn('h-px bg-border my-1', expanded ? 'mx-2' : 'mx-3')} />

        {/* Overview */}
        <div className={cn('flex', expanded ? 'px-2' : 'justify-center')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink
                to="/"
                end
                data-tour-int="overview"
                className={cn(
                  'h-10 rounded-lg flex items-center gap-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors',
                  expanded ? 'w-full px-2' : 'w-10 justify-center'
                )}
                activeClassName="bg-primary/10 text-primary"
              >
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                {expanded && <span className="text-sm font-medium truncate">Visão Geral</span>}
              </NavLink>
            </TooltipTrigger>
            {!expanded && <TooltipContent side="right">Visão Geral</TooltipContent>}
          </Tooltip>
        </div>

        {/* Groups with hover flyouts */}
        <nav className={cn('flex-1 flex flex-col gap-1 mt-1', expanded ? 'px-2' : 'items-center')}>
          {groups.map(group => {
            const active = isGroupActive(group);
            return (
              <HoverCard key={group.label} openDelay={80} closeDelay={120}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => navigate(`/categoria/${group.slug}`)}
                    data-tour={group.items.find(i => i.tourId)?.tourId}
                    data-tour-int={group.tourKey}
                    className={cn(
                      'h-10 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                      expanded ? 'w-full px-2' : 'w-10 justify-center',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                    aria-label={group.label}
                  >
                    <span className="shrink-0 flex items-center justify-center w-5 h-5">
                      {renderGroupIcon(group, active)}
                    </span>
                    {expanded && (
                      <span className="text-sm font-medium truncate">{group.label}</span>
                    )}
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="right" align="start" className="w-56 p-1.5">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-col">
                    {group.items.slice(0, 3).map(item => (
                      <button
                        key={item.url}
                        onClick={() => navigate(item.url)}
                        data-tour={item.tourId}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors',
                          isActive(item.url)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/60 text-foreground'
                        )}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 pt-1 border-t border-border/60">
                    <button
                      onClick={() => navigate(`/categoria/${group.slug}`)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      <span>Ver mais</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className={cn('flex flex-col gap-1 pb-1', expanded ? 'px-2' : 'items-center')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={toggle}
                className={cn('h-10 justify-start gap-2', expanded ? 'w-full px-2' : 'w-10 px-0 justify-center')}
              >
                {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                {expanded && <span className="text-sm">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>}
              </Button>
            </TooltipTrigger>
            {!expanded && <TooltipContent side="right">{isDark ? 'Modo Claro' : 'Modo Escuro'}</TooltipContent>}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={signOut}
                className={cn('h-10 justify-start gap-2', expanded ? 'w-full px-2' : 'w-10 px-0 justify-center')}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {expanded && <span className="text-sm">Sair</span>}
              </Button>
            </TooltipTrigger>
            {!expanded && <TooltipContent side="right">Sair{user?.email ? ` (${user.email})` : ''}</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
