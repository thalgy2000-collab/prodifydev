import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Settings, LogOut, Moon, Sun, CalendarDays } from 'lucide-react';
import prodifyLogo from '@/assets/prodify-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GlobalSidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const navItems = [
  { title: 'Início', url: '/inicio', icon: Home },
  { title: 'Meus Produtos', url: '/produtos', icon: Package },
  { title: 'Agenda', url: '/agenda', icon: CalendarDays },
];

export function GlobalSidebar({ searchQuery, onSearchChange }: GlobalSidebarProps) {
  const { signOut } = useAuth();
  const { nameOrEmail, initial, avatarColor, profile } = useProfile();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    toast.success('Você saiu da sua conta');
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <aside className="hidden md:flex flex-col w-[260px] min-h-screen border-r border-border bg-sidebar-background shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src={prodifyLogo} alt="Prodify" className="h-8 w-8 rounded-full object-cover shrink-0" />
          <span className="text-base font-bold text-sidebar-foreground">Prodify</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.url)
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </button>
        ))}

        <button
          onClick={() => navigate('/configuracoes')}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive('/configuracoes')
              ? 'bg-primary/10 text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </button>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        {/* User profile button */}
        <button
          onClick={() => navigate('/perfil')}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive('/perfil')
              ? 'bg-primary/10 text-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          )}
        >
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold truncate">
              {profile?.displayName || profile?.fullName || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </button>

        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
          </div>
          <Switch checked={isDark} onCheckedChange={toggle} />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
