import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { InstitucionProvider } from "@/hooks/useInstitucion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { InstallBanner } from "@/components/InstallBanner";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Grupos = lazy(() => import("./pages/Grupos"));
const Estudiantes = lazy(() => import("./pages/Estudiantes"));
const Asistencia = lazy(() => import("./pages/Asistencia"));
const Evaluaciones = lazy(() => import("./pages/Evaluaciones"));
const Seguimiento = lazy(() => import("./pages/Seguimiento"));
const DiarioClase = lazy(() => import("./pages/DiarioClase"));
const Planificacion = lazy(() => import("./pages/Planificacion"));
const Informes = lazy(() => import("./pages/Informes"));
const Analisis = lazy(() => import("./pages/Analisis"));
const Materias = lazy(() => import("./pages/Materias"));
const ModoClase = lazy(() => import("./pages/ModoClase"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Administracion = lazy(() => import("./pages/Administracion"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Instituciones = lazy(() => import("./pages/Instituciones"));
const Login = lazy(() => import("./pages/auth/Login"));
const RecoverPassword = lazy(() => import("./pages/auth/RecoverPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <UpdatePrompt />
        <InstallBanner />
        <BrowserRouter>
        <AuthProvider>
        <InstitucionProvider>
          <Suspense fallback={<div className="flex h-screen items-center justify-center"><span className="text-muted-foreground text-sm">Cargando…</span></div>}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar" element={<RecoverPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/instituciones" element={<Instituciones />} />
              <Route path="/materias" element={<Materias />} />
              <Route path="/grupos" element={<Grupos />} />
              <Route path="/estudiantes" element={<Estudiantes />} />
              <Route path="/asistencia" element={<Asistencia />} />
              <Route path="/evaluaciones" element={<Evaluaciones />} />
              <Route path="/seguimiento" element={<Seguimiento />} />
              <Route path="/diario" element={<DiarioClase />} />
              <Route path="/planificacion" element={<Planificacion />} />
              <Route path="/informes" element={<Informes />} />
              <Route path="/analisis" element={<Analisis />} />
              <Route path="/clase/:claseId" element={<ModoClase />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/administracion" element={<Administracion />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </InstitucionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
