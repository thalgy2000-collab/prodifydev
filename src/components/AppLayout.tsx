import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import prodifyLogo from '@/assets/prodify-logo.png';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border bg-card gap-2">
            <SidebarTrigger className="ml-3" />
            <img src={prodifyLogo} alt="Prodify" className="h-7 w-7 rounded-full object-cover" />
            <span className="text-sm font-semibold text-foreground">Prodify</span>
          </header>
          <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;