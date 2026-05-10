import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProductProvider, useProduct } from "@/contexts/ProductContext";
import { UndoProvider } from "@/contexts/UndoContext";
import { GlobalSidebar } from "./components/GlobalSidebar";
import { MobileHeader } from "./components/MobileHeader";
import { NotificationBell } from "./components/NotificationBell";
import { UndoButton } from "./components/UndoButton";
import AppLayout from "./components/AppLayout";
import { OnboardingTour } from "./components/OnboardingTour";
import TermsModal from "./components/TermsModal";
import WelcomeSurvey from "./components/WelcomeSurvey";
import { PageViewTracker } from "./components/PageViewTracker";
import { useProfile } from "./hooks/useProfile";
import PortfolioPage from "./pages/PortfolioPage";
import OKRPage from "./pages/OKRPage";
import RoadmapPage from "./pages/RoadmapPage";
import BacklogPage from "./pages/BacklogPage";
import SprintsPage from "./pages/SprintsPage";
import SprintHistoryPage from "./pages/SprintHistoryPage";
import AgendaPage from "./pages/AgendaPage";
import OpportunityTreePage from "./pages/OpportunityTreePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RicePage from "./pages/RicePage";
import ReleasePlanningPage from "./pages/ReleasePlanningPage";
import SwotPage from "./pages/SwotPage";
import CompetitionPage from "./pages/CompetitionPage";
import PrdPage from "./pages/PrdPage";
import MembersPage from "./pages/MembersPage";
import ProductAgendaPage from "./pages/ProductAgendaPage";
import ProductOverviewPage from "./pages/ProductOverviewPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import InviteAcceptPage from "./pages/InviteAcceptPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import CategoryPage from "./pages/CategoryPage";

const queryClient = new QueryClient();

const ProductRoutes = ({ searchQuery }: { searchQuery: string }) => {
  const { activeProduct } = useProduct();
  const location = useLocation();

  // Always render admin page when on /admin route
  if (location.pathname === '/admin') {
    return <AdminPage />;
  }

  // Always render profile page when on /perfil route
  if (location.pathname === '/perfil') {
    return <ProfilePage />;
  }

  // Always render home page when on /inicio route
  if (location.pathname === '/inicio') {
    return <HomePage />;
  }

  // Always render agenda page when on /agenda route
  if (location.pathname === '/agenda') {
    return <AgendaPage />;
  }

  // Always render portfolio page on /produtos (even when a product is active)
  if (location.pathname === '/produtos') {
    return <PortfolioPage searchQuery={searchQuery} />;
  }

  if (!activeProduct) {
    return <PortfolioPage searchQuery={searchQuery} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<ProductOverviewPage />} />
        <Route path="/categoria/:slug" element={<CategoryPage />} />
        <Route path="/okrs" element={<OKRPage />} />
        <Route path="/oportunidades" element={<OpportunityTreePage />} />
        <Route path="/swot" element={<SwotPage />} />
        <Route path="/concorrencia" element={<CompetitionPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/sprints" element={<SprintsPage />} />
        <Route path="/historico" element={<SprintHistoryPage />} />
        <Route path="/analises" element={<AnalyticsPage />} />
        <Route path="/rice" element={<RicePage />} />
        <Route path="/releases" element={<ReleasePlanningPage />} />
        <Route path="/prd" element={<PrdPage />} />
        <Route path="/produto-agenda" element={<ProductAgendaPage />} />
        <Route path="/membros" element={<MembersPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const externalTourSteps = [
  {
    type: 'spotlight' as const,
    selector: '[data-tour-ext="inicio"]',
    title: 'Início',
    description: 'Acesse sua visão geral pessoal.',
  },
  {
    type: 'spotlight' as const,
    selector: '[data-tour-ext="produtos"]',
    title: 'Meus Produtos',
    description: 'Selecione ou crie um produto para gerenciar.',
  },
  {
    type: 'spotlight' as const,
    selector: '[data-tour-ext="agenda"]',
    title: 'Agenda',
    description: 'Acompanhe seus eventos e tarefas pessoais.',
  },
  {
    type: 'spotlight' as const,
    selector: '[data-tour-ext="perfil"]',
    title: 'Perfil & Configurações',
    description: 'Personalize sua conta e preferências.',
  },
];

const GLOBAL_ROUTES = ['/inicio', '/agenda', '/perfil', '/admin', '/produtos'];

const AuthenticatedLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeProduct } = useProduct();
  const location = useLocation();
  const [showExternalTour, setShowExternalTour] = useState(false);

  const isGlobalRoute = GLOBAL_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + '/'));
  // Show the global chrome (sidebar + mobile header + bell) when there is no active product,
  // OR when the user is on a global (non-product-scoped) route like /inicio, /agenda, /perfil.
  const showGlobalChrome = !activeProduct || isGlobalRoute;

  useEffect(() => {
    if (activeProduct) return;
    let seen = false;
    try { seen = localStorage.getItem('tour_externo') === 'true'; } catch {}
    if (!seen) {
      const t = setTimeout(() => setShowExternalTour(true), 600);
      return () => clearTimeout(t);
    }
  }, [activeProduct]);

  return (
    <div className="min-h-screen flex w-full">
      {showGlobalChrome && <GlobalSidebar searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
      <div className="flex-1 flex flex-col min-w-0">
        {showGlobalChrome && <MobileHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
        {showGlobalChrome && (
          <div className="flex justify-end px-4 py-2 border-b border-border bg-card">
            <NotificationBell />
          </div>
        )}
        <ProductRoutes searchQuery={searchQuery} />
      </div>
      {showExternalTour && !activeProduct && (
        <OnboardingTour
          steps={externalTourSteps}
          storageKey="tour_externo"
          onComplete={() => setShowExternalTour(false)}
        />
      )}
    </div>
  );
};

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const pendingToken = localStorage.getItem('pending_invite_token');

  if (loading || profileLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If there's a pending invite token, redirect to accept it
  if (pendingToken) {
    return <Navigate to={`/invite/${pendingToken}`} replace />;
  }

  if (profile && !profile.termsAcceptedAt) {
    return <TermsModal onAccepted={refetch} />;
  }

  if (profile && !profile.surveyCompleted) {
    return <WelcomeSurvey onCompleted={refetch} />;
  }

  return (
    <ProductProvider>
      <PageViewTracker />
      <AuthenticatedLayout />
    </ProductProvider>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (user) return <Navigate to="/inicio" replace />;
  return <AuthPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRoute />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/invite/:token" element={<InviteAcceptPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
