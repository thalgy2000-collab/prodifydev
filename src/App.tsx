import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import OKRPage from "./pages/OKRPage";
import RoadmapPage from "./pages/RoadmapPage";
import BacklogPage from "./pages/BacklogPage";
import SprintsPage from "./pages/SprintsPage";
import SprintHistoryPage from "./pages/SprintHistoryPage";
import OpportunityTreePage from "./pages/OpportunityTreePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RicePage from "./pages/RicePage";
import AgendaPage from "./pages/AgendaPage";
import SwotPage from "./pages/SwotPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<OKRPage />} />
        <Route path="/oportunidades" element={<OpportunityTreePage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/sprints" element={<SprintsPage />} />
        <Route path="/historico" element={<SprintHistoryPage />} />
        <Route path="/analises" element={<AnalyticsPage />} />
        <Route path="/rice" element={<RicePage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
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
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;