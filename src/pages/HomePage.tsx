import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Package, Target, List, Map } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { profile, initial, avatarColor } = useProfile();

  const shortcuts = [
    { title: 'Meus Produtos', description: 'Gerencie seus produtos e portfólio', icon: Package, path: '/' },
    { title: 'OKRs', description: 'Acompanhe seus objetivos e resultados', icon: Target, path: '/' },
    { title: 'Backlog', description: 'Organize e priorize suas tarefas', icon: List, path: '/' },
    { title: 'Roadmap', description: 'Planeje e visualize seu futuro', icon: Map, path: '/' },
  ];

  return (
    <div className="space-y-10 p-8">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white overflow-hidden"
          style={{ backgroundColor: avatarColor }}
        >
          {profile?.avatarUrl
            ? <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            : initial
          }
        </div>
        <div>
          <h1 className="text-2xl font-bold">Olá, {profile?.displayName || profile?.fullName || 'Usuário'}!</h1>
          <p className="text-muted-foreground">Bem-vindo ao Prodify</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <button
              key={shortcut.title}
              onClick={() => navigate(shortcut.path)}
              className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/50 text-left"
            >
              <Icon className="mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{shortcut.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{shortcut.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;