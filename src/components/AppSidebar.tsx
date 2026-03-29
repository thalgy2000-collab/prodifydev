import { Target, Map, ListTodo, Zap, History, TreePine, BarChart3, Calculator, LogOut, Moon, Sun, Package, ChevronDown, Shield, Users, ArrowLeft, Check } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useProduct } from '@/contexts/ProductContext';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';

const groups = [
  {
    label: '📍 Planejamento',
    items: [
      { title: 'OKRs', url: '/', icon: Target },
      { title: 'Roadmap', url: '/roadmap', icon: Map },
      { title: 'Agenda', url: '/agenda', icon: CalendarDays },
    ],
  },
  {
    label: '🔍 Discovery',
    items: [
      { title: 'Oportunidades', url: '/oportunidades', icon: TreePine },
      { title: 'SWOT', url: '/swot', icon: Shield },
    ],
  },
  {
    label: '⚡ Priorização',
    items: [
      { title: 'RICE', url: '/rice', icon: Calculator },
    ],
  },
  {
    label: '🚀 Delivery',
    items: [
      { title: 'Backlog', url: '/backlog', icon: ListTodo },
      { title: 'Sprints', url: '/sprints', icon: Zap },
      { title: 'Histórico', url: '/historico', icon: History },
    ],
  },
  {
    label: '📊 Análises',
    items: [
      { title: 'Análises', url: '/analises', icon: BarChart3 },
    ],
  },
  {
    label: '⚙️ Configurações',
    items: [
      { title: 'Membros', url: '/membros', icon: Users },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut, user } = useAuth();
  const { activeProduct, setActiveProductId, products } = useProduct();
  const { isDark, toggle } = useTheme();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {!collapsed && activeProduct && (
          <div className="px-3 py-2">
            <button
              onClick={() => setActiveProductId(null)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Trocar produto
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors focus:outline-none">
                <span className="text-lg">{activeProduct.emoji}</span>
                <span className="text-sm font-semibold truncate flex-1 text-left">{activeProduct.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[220px]">
                {products.map(product => (
                  <DropdownMenuItem
                    key={product.id}
                    onClick={() => setActiveProductId(product.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-base">{product.emoji}</span>
                    <span className="truncate flex-1">{product.name}</span>
                    {product.id === activeProduct.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {collapsed && activeProduct && (
          <div className="flex justify-center py-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none" title={activeProduct.name}>
                <span className="text-lg">{activeProduct.emoji}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-[220px]">
                {products.map(product => (
                  <DropdownMenuItem
                    key={product.id}
                    onClick={() => setActiveProductId(product.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-base">{product.emoji}</span>
                    <span className="truncate flex-1">{product.name}</span>
                    {product.id === activeProduct.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {groups.map(group => (
          <Collapsible key={group.label} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                {!collapsed && <span>{group.label}</span>}
                {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-90" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <item.icon className="mr-2 h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          {!collapsed && user && (
            <p className="text-xs text-muted-foreground truncate mb-2 px-2">{user.email}</p>
          )}
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} className="w-full justify-start" onClick={toggle}>
              {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {!collapsed && (isDark ? 'Modo Claro' : 'Modo Escuro')}
            </Button>
            <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} className="w-full justify-start" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              {!collapsed && 'Sair'}
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}