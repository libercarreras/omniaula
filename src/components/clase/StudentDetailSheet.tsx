import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  estudiantes, observaciones, evaluaciones, getClaseLabel,
} from "@/data/mockData";
import {
  UserCheck, ClipboardCheck, MessageSquare, Calendar,
  Check, X, Clock,
} from "lucide-react";

interface StudentDetailSheetProps {
  studentId: string | null;
  claseId: string;
  open: boolean;
  onClose: () => void;
}

// Mock historical data for the student
const mockAsistenciaHistorial = [
  { fecha: "2026-03-07", estado: "presente" },
  { fecha: "2026-03-06", estado: "presente" },
  { fecha: "2026-03-05", estado: "tarde" },
  { fecha: "2026-03-04", estado: "presente" },
  { fecha: "2026-03-03", estado: "falta" },
];

const mockNotasHistorial = [
  { evaluacion: "Parcial Ecuaciones", nota: 7, fecha: "2026-03-01" },
  { evaluacion: "TP Funciones", nota: 8.5, fecha: "2026-02-20" },
  { evaluacion: "Oral Cinemática", nota: 6, fecha: "2026-02-10" },
];

export function StudentDetailSheet({ studentId, claseId, open, onClose }: StudentDetailSheetProps) {
  const student = estudiantes.find((e) => e.id === studentId);
  const studentObs = observaciones.filter((o) => o.estudianteId === studentId);

  if (!student) return null;

  const estadoIcon: Record<string, React.ReactNode> = {
    presente: <Check className="h-3.5 w-3.5 text-success" />,
    falta: <X className="h-3.5 w-3.5 text-destructive" />,
    tarde: <Clock className="h-3.5 w-3.5 text-warning" />,
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {student.nombre[0]}{student.apellido[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left">
                {student.apellido}, {student.nombre}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">{student.grupoNombre}</p>
            </div>
            {student.enRiesgo && (
              <Badge variant="destructive" className="ml-auto">En riesgo</Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="asistencia" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="asistencia" className="text-xs gap-1">
              <UserCheck className="h-3.5 w-3.5" /> Asist.
            </TabsTrigger>
            <TabsTrigger value="notas" className="text-xs gap-1">
              <ClipboardCheck className="h-3.5 w-3.5" /> Notas
            </TabsTrigger>
            <TabsTrigger value="observaciones" className="text-xs gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Obs.
            </TabsTrigger>
            <TabsTrigger value="historial" className="text-xs gap-1">
              <Calendar className="h-3.5 w-3.5" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="asistencia" className="mt-4 space-y-2">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-success">85%</p>
                  <p className="text-xs text-muted-foreground">Asistencia</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">2</p>
                  <p className="text-xs text-muted-foreground">Faltas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-warning">1</p>
                  <p className="text-xs text-muted-foreground">Tardanzas</p>
                </CardContent>
              </Card>
            </div>
            {mockAsistenciaHistorial.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <span className="text-sm">{item.fecha}</span>
                <div className="flex items-center gap-1.5">
                  {estadoIcon[item.estado]}
                  <span className="text-xs capitalize">{item.estado}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="notas" className="mt-4 space-y-2">
            <Card className="mb-4">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">7.2</p>
                <p className="text-xs text-muted-foreground">Promedio general</p>
              </CardContent>
            </Card>
            {mockNotasHistorial.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{item.evaluacion}</p>
                  <p className="text-xs text-muted-foreground">{item.fecha}</p>
                </div>
                <span className="text-lg font-bold text-primary">{item.nota}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="observaciones" className="mt-4 space-y-2">
            {studentObs.length > 0 ? (
              studentObs.map((obs) => (
                <Card key={obs.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant="secondary" className="text-xs">{obs.tipo}</Badge>
                      <span className="text-xs text-muted-foreground">{obs.fecha}</span>
                    </div>
                    <p className="text-sm mt-1">{obs.nota}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getClaseLabel(obs.claseId)}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin observaciones registradas
              </p>
            )}
          </TabsContent>

          <TabsContent value="historial" className="mt-4">
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resumen general</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Asistencia total</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Promedio notas</span>
                    <span className="font-medium">7.2</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Participación</span>
                    <span className="font-medium">Media</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Observaciones</span>
                    <span className="font-medium">{studentObs.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
