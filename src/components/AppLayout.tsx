import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { OnboardingTour, TourStep } from '@/components/OnboardingTour';
import { PendingInviteBanner } from '@/components/PendingInviteBanner';
import { NotificationBell } from '@/components/NotificationBell';
import { CategoryBreadcrumb } from '@/components/CategoryBreadcrumb';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useProduct } from '@/contexts/ProductContext';
import { LayoutDashboard, Target, Compass, Calculator, Rocket, BarChart3, ChevronLeft } from 'lucide-react';

const buildInternalSteps = (): TourStep[] => [
  {
    type: 'spotlight',
    selector: '[data-tour-int="overview"]',
    title: 'Visão Geral',
    description: 'Acompanhe métricas como OKRs, progresso de KRs, tarefas abertas e próximas atividades.',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour-int="planejamento"]',
    title: 'Planejamento',
    description: 'Acesse OKRs, Roadmap, Releases, PRD e Agenda do produto.',
    icon: <Target className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour-int="discovery"]',
    title: 'Discovery',
    description: 'Mapeie oportunidades e faça análise SWOT.',
    icon: <Compass className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour-int="priorizacao"]',
    title: 'Priorização',
    description: 'Priorize tarefas pelo framework RICE.',
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour-int="delivery"]',
    title: 'Delivery',
    description: 'Gerencie Backlog, Sprints e Histórico de entregas.',
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour-int="analises"]',
    title: 'Análises',
    description: 'Acompanhe métricas e evolução do produto.',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour-int="membros"]',
    title: 'Membros',
    description: 'Gerencie quem tem acesso ao produto.',
    icon: <span className="text-lg leading-none">👥</span>,
  },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, initial, avatarColor } = useProfile();
  const { activeProduct } = useProduct();
  const navigate = useNavigate();
  const [showTour, setShowTour] = useState(false);

  const storageKey = activeProduct ? `tour_interno_${activeProduct.id}` : '';
  const steps = useMemo(buildInternalSteps, []);

  useEffect(() => {
    if (!activeProduct) return;
    let seen = false;
    try {
      seen = localStorage.getItem(`tour_interno_${activeProduct.id}`) === 'true';
    } catch {}
    if (!seen) {
      const timer = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [activeProduct?.id]);

  return (
    <>
      <div className="flex w-full h-screen overflow-hidden">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-16 lg:pb-0">
          <header className="h-12 flex items-center justify-between gap-2 border-b border-border bg-card px-3 sticky top-0 z-20">
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <button
                onClick={() => navigate('/inicio')}
                aria-label="Voltar ao Início"
                className="p-1.5 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {activeProduct && (
                <>
                  <span className="text-lg leading-none">{activeProduct.emoji}</span>
                  <span className="text-sm font-semibold truncate">{activeProduct.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <NotificationBell />
              <button
                onClick={() => navigate('/perfil')}
                aria-label="Abrir perfil"
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8 text-xs font-bold">
                  {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="Avatar" /> : null}
                  <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          </header>
          <PendingInviteBanner />
          <CategoryBreadcrumb />
          <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
      {showTour && storageKey && (
        <OnboardingTour
          steps={steps}
          storageKey={storageKey}
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
};

export default AppLayout;
