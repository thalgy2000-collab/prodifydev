import { Target, Map, ListTodo, Zap, History, TreePine, BarChart3, Calculator, LogOut, Moon, Sun, CalendarDays } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'OKRs', url: '/', icon: Target },
  { title: 'Oportunidades', url: '/oportunidades', icon: TreePine },
  { title: 'RICE', url: '/rice', icon: Calculator },
  { title: 'Roadmap', url: '/roadmap', icon: Map },
  { title: 'Backlog', url: '/backlog', icon: ListTodo },
  { title: 'Sprints', url: '/sprints', icon: Zap },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays },
  { title: 'Histórico', url: '/historico', icon: History },
  { title: 'Análises', url: '/analises', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut, user } = useAuth();
  const { isDark, toggle } = useTheme();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && <span className="font-bold">Metas & OKRs</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
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
        </SidebarGroup>
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