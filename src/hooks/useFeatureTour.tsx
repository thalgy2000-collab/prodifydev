import { useEffect, useState } from 'react';
import { OnboardingTour, TourStep } from '@/components/OnboardingTour';

/**
 * Hook utilitário para tours individuais por feature.
 * - Armazena conclusão em localStorage com a chave `tour_<key>`.
 * - Inicia automaticamente na primeira visita (após pequeno delay para o DOM montar).
 */
export function useFeatureTour(key: string, steps: TourStep[], delay = 700) {
  const [show, setShow] = useState(false);
  const storageKey = `tour_${key}`;

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === 'true';
    } catch {}
    if (!seen) {
      const t = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(t);
    }
  }, [storageKey, delay]);

  const TourElement = show ? (
    <OnboardingTour
      steps={steps}
      storageKey={storageKey}
      onComplete={() => setShow(false)}
    />
  ) : null;

  return { TourElement };
}
