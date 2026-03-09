import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";

export default function Planificacion() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Planificación</h1>
        <Button size="lg" className="gap-2"><Plus className="h-4 w-4" /> Nueva planificación</Button>
      </div>
      <Card className="border-dashed">
        <CardContent className="p-8 text-center space-y-3">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No hay planificaciones creadas aún.</p>
          <p className="text-xs text-muted-foreground">Próximamente podrás gestionar tus planificaciones aquí.</p>
        </CardContent>
      </Card>
    </div>
  );
}
