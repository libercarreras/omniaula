import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCheck, ClipboardCheck, MessageSquare, Calendar,
  Check, X, Clock, Copy, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StudentDetailSheetProps {
  studentId: string | null;
  claseId: string;
  open: boolean;
  onClose: () => void;
}

export function StudentDetailSheet({ studentId, claseId, open, onClose }: StudentDetailSheetProps) {
  const [student, setStudent] = useState<any>(null);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId || !open) return;
    setLoading(true);
    const fetch = async () => {
      const [estRes, obsRes] = await Promise.all([
        supabase.from("estudiantes").select("*").eq("id", studentId).maybeSingle(),
        supabase.from("observaciones").select("*").eq("estudiante_id", studentId).order("fecha", { ascending: false }),
      ]);
      setStudent(estRes.data);
      setObservaciones(obsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [studentId, open]);

  if (!student && !loading) return null;

  const getInitials = (name: string) => {
    const parts = name?.split(" ") || [];
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (name || "?").substring(0, 2);
  };

  const copiarResumen = () => {
    if (!student) return;
    const resumen = [
      `📋 Resumen del estudiante`,
      `Nombre: ${student.nombre_completo}`,
      `Observaciones: ${observaciones.length > 0 ? observaciones.map(o => o.descripcion).join("; ") : "Sin observaciones"}`,
    ].join("\n");
    navigator.clipboard.writeText(resumen);
    toast.success("Resumen copiado al portapapeles");
  };

  const tipoLabel: Record<string, string> = {
    participacion: "Participación",
    actitud: "Actitud",
    cumplimiento_tareas: "Tareas",
    dificultad_contenidos: "Dificultad",
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : student ? (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(student.nombre_completo)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <SheetTitle className="text-left">{student.nombre_completo}</SheetTitle>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={copiarResumen}>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue="observaciones" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="observaciones" className="text-xs gap-1"><MessageSquare className="h-3.5 w-3.5" /> Observaciones</TabsTrigger>
                <TabsTrigger value="historial" className="text-xs gap-1"><Calendar className="h-3.5 w-3.5" /> Info</TabsTrigger>
              </TabsList>

              <TabsContent value="observaciones" className="mt-4 space-y-2">
                {observaciones.length > 0 ? (
                  observaciones.map(obs => (
                    <Card key={obs.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <Badge variant="secondary" className="text-xs">{tipoLabel[obs.tipo] || obs.tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{obs.fecha}</span>
                        </div>
                        <p className="text-sm mt-1">{obs.descripcion}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin observaciones registradas</p>
                )}
              </TabsContent>

              <TabsContent value="historial" className="mt-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Información del estudiante</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nombre</span>
                      <span className="font-medium">{student.nombre_completo}</span>
                    </div>
                    {student.numero_lista && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">N° de lista</span>
                        <span className="font-medium">#{student.numero_lista}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Observaciones</span>
                      <span className="font-medium">{observaciones.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
