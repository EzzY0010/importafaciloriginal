import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isBackendConfigured } from "@/lib/backend";

const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const MockDashboard = () => (
  <div className="min-h-screen bg-background p-4 sm:p-6">
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Badge className="bg-accent/20 text-accent border border-accent/30">Modo temporário (mock)</Badge>
      </div>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Interface restaurada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>O backend está temporariamente indisponível neste ambiente, então os dados exibidos abaixo são estáticos para manter o layout funcional.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs">Total de peças</p>
              <p className="text-xl font-bold text-foreground">12</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs">Frete médio</p>
              <p className="text-xl font-bold text-foreground">R$ 38,00</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs">Lucro estimado</p>
              <p className="text-xl font-bold text-foreground">R$ 1.240,00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild>
          <Link to="/admin">Abrir Admin</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">Ir para Login</Link>
        </Button>
      </div>
    </div>
  </div>
);

const MockAdminPanel = () => (
  <div className="min-h-screen bg-background p-4 sm:p-6">
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
        <Badge className="bg-accent/20 text-accent border border-accent/30">Modo temporário (mock)</Badge>
      </div>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle>Dispositivos bloqueados (mock)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="p-3 rounded-lg border border-border bg-card">
            <p className="font-medium text-foreground">Aluno Demo 1</p>
            <p className="text-muted-foreground">IP: 189.120.xx.xx · São Paulo, BR · FP: demo-fp-001</p>
          </div>
          <div className="p-3 rounded-lg border border-border bg-card">
            <p className="font-medium text-foreground">Aluno Demo 2</p>
            <p className="text-muted-foreground">IP: 177.18.xx.xx · Lisboa, PT · FP: demo-fp-002</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link to="/dashboard">Voltar ao Dashboard</Link>
      </Button>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={isBackendConfigured ? <Dashboard /> : <MockDashboard />} />
                <Route path="/admin" element={isBackendConfigured ? <AdminPanel /> : <MockAdminPanel />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
