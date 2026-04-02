import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronLeft, ChevronRight, Sparkles, Target, Map, ListTodo, Zap, Rocket } from 'lucide-react';

interface TourStep {
  type: 'modal' | 'spotlight';
  selector?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: TourStep[] = [
  {
    type: 'modal',
    title: 'Bem-vindo ao Prodify! 🎉',
    description: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades e começar a gerenciar seu produto como um profissional.',
    icon: <Sparkles className="h-8 w-8 text-primary" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour="okrs"]',
    title: 'OKRs',
    description: 'Defina seus objetivos e resultados-chave para alinhar sua equipe em torno das metas mais importantes.',
    icon: <Target className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour="roadmap"]',
    title: 'Roadmap',
    description: 'Visualize suas iniciativas no tempo com um cronograma Gantt interativo.',
    icon: <Map className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour="backlog"]',
    title: 'Backlog',
    description: 'Gerencie suas tarefas e histórias de usuário em um só lugar.',
    icon: <ListTodo className="h-5 w-5" />,
  },
  {
    type: 'spotlight',
    selector: '[data-tour="sprints"]',
    title: 'Sprints',
    description: 'Execute suas tarefas em ciclos curtos e acompanhe o progresso da equipe.',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    type: 'modal',
    title: 'Tudo pronto! 🚀',
    description: 'Você está preparado para começar a usar o Prodify. Explore as funcionalidades e construa produtos incríveis!',
    icon: <Rocket className="h-8 w-8 text-primary" />,
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const { user } = useAuth();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  const completeOnboarding = useCallback(async () => {
    if (user) {
      await supabase.from('profiles').update({ onboarding_completed: true } as any).eq('id', user.id);
    }
    onComplete();
  }, [user, onComplete]);

  const updateSpotlight = useCallback(() => {
    if (step.type === 'spotlight' && step.selector) {
      const el = document.querySelector(step.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSpotlightRect(rect);
      } else {
        setSpotlightRect(null);
      }
    } else {
      setSpotlightRect(null);
    }
  }, [step]);

  useEffect(() => {
    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    return () => window.removeEventListener('resize', updateSpotlight);
  }, [updateSpotlight]);

  // Position tooltip next to spotlight
  useEffect(() => {
    if (!spotlightRect || !tooltipRef.current) {
      setTooltipStyle({});
      return;
    }
    const tooltip = tooltipRef.current;
    const tooltipWidth = 320;
    const padding = 16;

    // Place tooltip to the right of the element
    let left = spotlightRect.right + padding;
    let top = spotlightRect.top;

    // If it overflows the right edge, place it to the left
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = spotlightRect.left - tooltipWidth - padding;
    }

    // Keep within vertical bounds
    if (top + tooltip.offsetHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltip.offsetHeight - padding;
    }
    if (top < padding) top = padding;

    setTooltipStyle({ position: 'fixed', left, top, width: tooltipWidth });
  }, [spotlightRect, currentStep]);

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else completeOnboarding();
  };
  const prev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const isModal = step.type === 'modal';

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      {isModal ? (
        <div className="absolute inset-0 bg-black/70 animate-fade-in" />
      ) : (
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <rect
                  x={spotlightRect.left - 6}
                  y={spotlightRect.top - 6}
                  width={spotlightRect.width + 12}
                  height={spotlightRect.height + 12}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0" y="0" width="100%" height="100%"
            fill="rgba(0,0,0,0.75)"
            mask="url(#spotlight-mask)"
            style={{ pointerEvents: 'auto' }}
          />
        </svg>
      )}

      {/* Spotlight ring */}
      {spotlightRect && !isModal && (
        <div
          className="absolute rounded-lg ring-2 ring-primary/60 animate-pulse pointer-events-none"
          style={{
            left: spotlightRect.left - 6,
            top: spotlightRect.top - 6,
            width: spotlightRect.width + 12,
            height: spotlightRect.height + 12,
          }}
        />
      )}

      {/* Content */}
      {isModal ? (
        // Centered modal
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-card border border-primary/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-primary/10 animate-scale-in text-center">
            <div className="flex justify-center mb-4">{step.icon}</div>
            <h2 className="text-xl font-bold text-foreground mb-3">{step.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{step.description}</p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              {!isFirst ? (
                <Button variant="ghost" size="sm" onClick={prev} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={completeOnboarding} className="text-muted-foreground">
                  Pular tour
                </Button>
              )}
              <Button size="sm" onClick={next} className="gap-1">
                {isLast ? 'Começar a usar' : 'Próximo'} {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Spotlight tooltip
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className="fixed z-[10000] bg-card border border-primary/30 rounded-xl p-5 shadow-2xl shadow-primary/10 animate-scale-in"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="text-primary">{step.icon}</div>
            <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={prev} className="gap-1 h-8 text-xs">
              <ChevronLeft className="h-3 w-3" /> Anterior
            </Button>
            <Button variant="ghost" size="sm" onClick={completeOnboarding} className="text-muted-foreground h-8 text-xs">
              Pular
            </Button>
            <Button size="sm" onClick={next} className="gap-1 h-8 text-xs">
              Próximo <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Skip button on spotlight steps */}
      {!isModal && (
        <button
          onClick={completeOnboarding}
          className="fixed top-4 right-4 z-[10001] text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
