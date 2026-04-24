import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, Package, CalendarDays, ShieldCheck, LogOut, Moon, Sun } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import prodifyLogo from '@/assets/prodify-logo.png';

interface MobileHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function MobileHeader({ searchQuery, onSearchChange }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { nameOrEmail, initial, avatarColor, profile } = useProfile();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success('Você saiu da sua conta');
    setOpen(false);
  };

  const go = (url: string) => { navigate(url); setOpen(false); };
  const isActive = (url: string) => location.pathname === url;

  const navItems = [
    { title: 'Início', url: '/', icon: Home },
    { title: 'Meus Produtos', url: '/produtos', icon: Package },
    { title: 'Configurações', url: '/configuracoes', icon: Settings },
  ];

  return (
    <header className="md:hidden h-14 flex items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <img src={prodifyLogo} alt="Prodify" className="h-7 w-7 rounded-full object-cover" />
        <span className="text-sm font-semibold">Prodify</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          {/* User - clickable to profile */}
          <button onClick={() => go('/perfil')} className="p-4 border-b border-border w-full text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {profile?.displayName || profile?.fullName || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
          </button>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.url}
                onClick={() => go(item.url)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.url) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </button>
            ))}

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                showSearch ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              )}
            >
              <Search className="h-4 w-4" />
              Pesquisar Produto
            </button>
            {showSearch && (
              <div className="px-1 pb-1">
                <div className="relative">
                  <Input
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Buscar produto..."
                    className="pr-8 h-9 text-sm"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </nav>

          <div className="p-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>{isDark ? 'Modo Escuro' : 'Modo Claro'}</span>
              </div>
              <Switch checked={isDark} onCheckedChange={toggle} />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
