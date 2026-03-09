import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Grupos from "./pages/Grupos";
import Estudiantes from "./pages/Estudiantes";
import Asistencia from "./pages/Asistencia";
import Evaluaciones from "./pages/Evaluaciones";
import Seguimiento from "./pages/Seguimiento";
import DiarioClase from "./pages/DiarioClase";
import Planificacion from "./pages/Planificacion";
import Informes from "./pages/Informes";
import Analisis from "./pages/Analisis";
import Materias from "./pages/Materias";
import ModoClase from "./pages/ModoClase";
import Perfil from "./pages/Perfil";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import RecoverPassword from "./pages/auth/RecoverPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/recuperar" element={<RecoverPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
