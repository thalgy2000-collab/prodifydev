import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProductProvider, useProduct } from "@/contexts/ProductContext";
import { GlobalSidebar } from "./components/GlobalSidebar";
import { MobileHeader } from "./components/MobileHeader";
import { NotificationBell } from "./components/NotificationBell";
import AppLayout from "./components/AppLayout";
import TermsModal from "./components/TermsModal";
import { useProfile } from "./hooks/useProfile";
import PortfolioPage from "./pages/PortfolioPage";
import OKRPage from "./pages/OKRPage";
import RoadmapPage from "./pages/RoadmapPage";
import BacklogPage from "./pages/BacklogPage";
import SprintsPage from "./pages/SprintsPage";
import SprintHistoryPage from "./pages/SprintHistoryPage";
import OpportunityTreePage from "./pages/OpportunityTreePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RicePage from "./pages/RicePage";
import ReleasePlanningPage from "./pages/ReleasePlanningPage";
import SwotPage from "./pages/SwotPage";
import PrdPage from "./pages/PrdPage";
import MembersPage from "./pages/MembersPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import InviteAcceptPage from "./pages/InviteAcceptPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProductRoutes = ({ searchQuery }: { searchQuery: string }) => {
  const { activeProduct } = useProduct();
  const location = useLocation();

  // Always render profile page when on /perfil route
  if (location.pathname === '/perfil') {
    return <ProfilePage />;
  }

  // Always render home page when on /inicio route
  if (location.pathname === '/inicio') {
    return <HomePage />;
  }

  if (!activeProduct) {
    return <PortfolioPage searchQuery={searchQuery} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<OKRPage />} />
        <Route path="/oportunidades" element={<OpportunityTreePage />} />
        <Route path="/swot" element={<SwotPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/sprints" element={<SprintsPage />} />
        <Route path="/historico" element={<SprintHistoryPage />} />
        <Route path="/analises" element={<AnalyticsPage />} />
        <Route path="/rice" element={<RicePage />} />
        <Route path="/releases" element={<ReleasePlanningPage />} />
        <Route path="/prd" element={<PrdPage />} />
        <Route path="/membros" element={<MembersPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const AuthenticatedLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { activeProduct } = useProduct();

  return (
    <div className="min-h-screen flex w-full">
      {!activeProduct && <GlobalSidebar searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeProduct && <MobileHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
        {!activeProduct && (
          <div className="flex justify-end px-4 py-2 border-b border-border bg-card">
            <NotificationBell />
          </div>
        )}
        <ProductRoutes searchQuery={searchQuery} />
      </div>
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

  return (
    <ProductProvider>
      <AuthenticatedLayout />
    </ProductProvider>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (user) return <Navigate to="/" replace />;
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
