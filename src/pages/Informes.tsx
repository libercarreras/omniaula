import { Card, CardContent } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

export default function Informes() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold">Informes</h1>
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <FileBarChart className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="font-display font-semibold text-lg mb-2">Informes automáticos</h2>
          <p className="text-muted-foreground max-w-md">
            Próximamente podrás generar informes de asistencia, rendimiento y seguimiento de tus estudiantes de forma automática.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
