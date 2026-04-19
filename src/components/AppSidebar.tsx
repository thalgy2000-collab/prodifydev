import { Target, ListTodo, BarChart3, Calculator, LogOut, Moon, Sun, ChevronDown, Shield, Users, ArrowLeft, Check, Calendar, LayoutDashboard, Compass, Rocket, Settings } from 'lucide-react';
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
type Group = { label: string; icon: typeof Target; items: Item[] };

const groups: Group[] = [
  {
    label: 'Planejamento',
    icon: Target,
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
    items: [
      { title: 'Oportunidades', url: '/oportunidades' },
      { title: 'SWOT', url: '/swot' },
    ],
  },
  {
    label: 'Priorização',
    icon: Calculator,
    items: [{ title: 'RICE', url: '/rice' }],
  },
  {
    label: 'Delivery',
    icon: Rocket,
    items: [
      { title: 'Backlog', url: '/backlog', tourId: 'backlog' },
      { title: 'Sprints', url: '/sprints', tourId: 'sprints' },
      { title: 'Histórico', url: '/historico' },
    ],
  },
  {
    label: 'Análises',
    icon: BarChart3,
    items: [{ title: 'Análises', url: '/analises' }],
  },
  {
    label: 'Configurações',
    icon: Settings,
    items: [{ title: 'Membros', url: '/membros' }],
  },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { activeProduct, setActiveProductId, products } = useProduct();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isGroupActive = (g: Group) => g.items.some(i => location.pathname === i.url);
  const isActive = (path: string) => location.pathname === path;

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="h-screen sticky top-0 w-14 shrink-0 border-r border-border bg-card flex flex-col items-center py-2 gap-2 z-30">
        {/* Product switcher */}
        {activeProduct && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-10 w-10 rounded-lg flex items-center justify-center text-xl hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                title={activeProduct.name}
                aria-label="Trocar produto"
              >
                {activeProduct.emoji}
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
        )}

        <div className="h-px w-8 bg-border my-1" />

        {/* Overview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/"
              end
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors'
              )}
              activeClassName="bg-primary/10 text-primary"
            >
              <LayoutDashboard className="h-5 w-5" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">Visão Geral</TooltipContent>
        </Tooltip>

        {/* Groups with hover flyouts */}
        <nav className="flex-1 flex flex-col gap-1 items-center mt-1">
          {groups.map(group => {
            const Icon = group.icon;
            const active = isGroupActive(group);
            return (
              <HoverCard key={group.label} openDelay={80} closeDelay={120}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => navigate(group.items[0].url)}
                    data-tour={group.items.find(i => i.tourId)?.tourId}
                    className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                    aria-label={group.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="right" align="start" className="w-56 p-1.5">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="flex flex-col">
                    {group.items.map(item => (
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
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="flex flex-col gap-1 items-center pb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggle}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{isDark ? 'Modo Claro' : 'Modo Escuro'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair{user?.email ? ` (${user.email})` : ''}</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
