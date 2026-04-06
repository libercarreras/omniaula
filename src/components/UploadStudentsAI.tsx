import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createStudentWithEdgeFunction } from "@/lib/createStudentWithEdgeFunction";

interface UploadStudentsAIProps {
  grupoId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadStudentsAI({ grupoId, isOpen, onOpenChange, onSuccess }: UploadStudentsAIProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<Array<{ nombre_completo: string; numero_lista: number | null }>>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("No autenticado");
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const fileName = file.name;
        const mimeType = file.type;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-students-ai`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName,
              mimeType,
              base64,
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          toast.error("Error al procesar archivo", { description: data.error });
          setIsLoading(false);
          return;
        }

        setPreview(data.estudiantes);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Error", { description: (err as Error).message });
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!preview.length || !grupoId) return;

    setIsLoading(true);
    let uploaded = 0;
    let failed = 0;

    for (const student of preview) {
      try {
        await createStudentWithEdgeFunction({
          nombre_completo: student.nombre_completo,
          grupo_id: grupoId,
          numero_lista: student.numero_lista,
        });
        uploaded++;
      } catch (err) {
        failed++;
        toast.error(`Error al crear ${student.nombre_completo}`, {
          description: (err as Error).message,
        });
      }
    }

    setIsLoading(false);
    toast.success(`${uploaded} estudiante(s) creado(s)`);
    if (uploaded > 0) {
      setPreview([]);
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Cargar estudiantes con IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Archivo (Excel, Word o CSV)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.docx,.csv,.txt"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              La IA analizará el archivo y extraerá automáticamente los nombres de los estudiantes.
            </p>
          </div>

          {preview.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-sm font-medium mb-2">{preview.length} estudiante(s) detectado(s):</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {preview.map((s, i) => (
                  <p key={i} className="text-xs">
                    {s.numero_lista ? `#${s.numero_lista} - ` : ""}{s.nombre_completo}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!preview.length || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Subir {preview.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
