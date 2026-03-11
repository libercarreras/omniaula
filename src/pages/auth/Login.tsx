import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [introEnded, setIntroEnded] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const handleVideoEnd = () => {
    setVideoFading(true);
    setTimeout(() => setIntroEnded(true), 600);
  };

  const skipIntro = () => {
    if (videoRef.current) videoRef.current.pause();
    handleVideoEnd();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Credenciales incorrectas"
        : error.message === "Signups not allowed for this instance"
        ? "El registro no está disponible. Contacta al administrador."
        : error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Intro video overlay */}
      {!introEnded && (
        <div
          className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[600ms] ${
            videoFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <video
            ref={videoRef}
            src="/intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnd}
            className="w-full h-full object-contain"
          />
          <button
            onClick={skipIntro}
            className="absolute bottom-8 right-8 text-white/50 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200 rounded-full px-4 py-2"
          >
            Omitir
          </button>
        </div>
      )}

      {/* Login form */}
      <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${
        introEnded ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}>
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-display">Libreta Digital Docente</CardTitle>
            <CardDescription>Ingresa a tu cuenta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="profesor@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Las cuentas son creadas por el administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
