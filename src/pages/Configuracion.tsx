import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ConfiguracionTab from "@/components/admin/ConfiguracionTab";

export default function Configuracion() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role && role !== "admin") {
      navigate("/");
    }
  }, [role, navigate]);

  if (role !== "admin") return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
          <Settings className="h-4 w-4" />
          Personalización de la aplicación
        </p>
      </div>

      <ConfiguracionTab />
    </div>
  );
}
