import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TourStep {
  type: 'modal' | 'spotlight';
  selector?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  before?: () => void;
}

interface Props {
  steps: TourStep[];
  storageKey: string;
  onComplete: () => void;
}

export function OnboardingTour({ steps, storageKey, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  const finish = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
    onComplete();
  }, [storageKey, onComplete]);

  const updateSpotlight = useCallback(() => {
    if (step?.type === 'spotlight' && step.selector) {
      const el = document.querySelector(step.selector);
      if (el) {
        // Ensure visible
        (el as HTMLElement).scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
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
    const t = setTimeout(updateSpotlight, 80);
    window.addEventListener('resize', updateSpotlight);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateSpotlight);
    };
  }, [updateSpotlight]);

  useEffect(() => {
    if (!tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    const tooltipWidth = 320;
    const padding = 16;
    // Fallback: if spotlight target wasn't found, center the tooltip on screen.
    if (!spotlightRect) {
      const left = Math.max(padding, (window.innerWidth - tooltipWidth) / 2);
      const top = Math.max(padding, (window.innerHeight - tooltip.offsetHeight) / 2);
      setTooltipStyle({ position: 'fixed', left, top, width: tooltipWidth });
      return;
    }
    let left = spotlightRect.right + padding;
    let top = spotlightRect.top;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = spotlightRect.left - tooltipWidth - padding;
    }
    if (left < padding) left = padding;
    if (top + tooltip.offsetHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltip.offsetHeight - padding;
    }
    if (top < padding) top = padding;
    setTooltipStyle({ position: 'fixed', left, top, width: tooltipWidth });
  }, [spotlightRect, currentStep]);

  if (!step) return null;

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(s => s + 1);
    else finish();
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

      {isModal ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-card border border-primary/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-primary/10 animate-scale-in text-center">
            {step.icon && <div className="flex justify-center mb-4">{step.icon}</div>}
            <h2 className="text-xl font-bold text-foreground mb-3">{step.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{step.description}</p>

            <div className="flex justify-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mb-4">{currentStep + 1} de {steps.length}</p>

            <div className="flex items-center justify-between gap-3">
              {!isFirst ? (
                <Button variant="ghost" size="sm" onClick={prev} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
                  Pular tour
                </Button>
              )}
              <Button size="sm" onClick={next} className="gap-1">
                {isLast ? 'Concluir' : 'Próximo'} {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={tooltipRef}
          style={tooltipStyle}
          className="fixed z-[10000] bg-card border border-primary/30 rounded-xl p-5 shadow-2xl shadow-primary/10 animate-scale-in"
        >
          <div className="flex items-center gap-2 mb-2">
            {step.icon && <div className="text-primary">{step.icon}</div>}
            <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

          <div className="flex gap-1.5 mb-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-3">{currentStep + 1} de {steps.length}</p>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={prev} disabled={isFirst} className="gap-1 h-8 text-xs">
              <ChevronLeft className="h-3 w-3" /> Anterior
            </Button>
            <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground h-8 text-xs">
              Pular
            </Button>
            <Button size="sm" onClick={next} className="gap-1 h-8 text-xs">
              {isLast ? 'Concluir' : 'Próximo'} {!isLast && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      {!isModal && (
        <button
          onClick={finish}
          className="fixed top-4 right-4 z-[10001] text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar tour"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
