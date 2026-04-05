import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { OnboardingTour } from '@/components/OnboardingTour';
import { PendingInviteBanner } from '@/components/PendingInviteBanner';
import { NotificationBell } from '@/components/NotificationBell';
import { useProfile } from '@/hooks/useProfile';
import { useProduct } from '@/contexts/ProductContext';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, refetch } = useProfile();
  const { products } = useProduct();
  const [showTour, setShowTour] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);

  // Show tour when: profile loaded, onboarding not completed, has exactly 1 product, and tour not dismissed this session
  useEffect(() => {
    if (profile && !profile.onboardingCompleted && products.length >= 1 && !tourDismissed) {
      // Small delay so sidebar renders and elements are in DOM
      const timer = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [profile, products.length, tourDismissed]);

  const handleTourComplete = () => {
    setShowTour(false);
    setTourDismissed(true);
    refetch();
  };

  return (
    <SidebarProvider>
      <div className="flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border bg-card px-3">
            <SidebarTrigger />
            <NotificationBell />
          </header>
          <PendingInviteBanner />
          <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
      {showTour && <OnboardingTour onComplete={handleTourComplete} />}
    </SidebarProvider>
  );
};

export default AppLayout;
