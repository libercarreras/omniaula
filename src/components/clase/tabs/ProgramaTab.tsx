import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Trash2, Loader2 } from "lucide-react";
import { EstructuraPrograma } from "@/components/programa/EstructuraPrograma";
import { PlanificacionTimeline } from "@/components/programa/PlanificacionTimeline";

interface ProgramaTabProps {
  claseId: string;
  userId: string;
  horario: string | null;
  programaContenido: string;
  programaArchivoUrl: string | null;
  programaArchivoNombre: string | null;
  programaEstructura: any;
  uploadingFile: boolean;
  savingEstructura: boolean;
  onContenidoChange: (value: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onSaveEstructura: (est: any) => Promise<void>;
}

export function ProgramaTab({
  claseId, userId, horario,
  programaContenido, programaArchivoUrl, programaArchivoNombre,
  programaEstructura, uploadingFile, savingEstructura,
  onContenidoChange, onFileUpload, onRemoveFile, onSaveEstructura,
}: ProgramaTabProps) {
  return (
    <div className="space-y-4 py-3">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Contenido del programa anual</Label>
        <Textarea
          placeholder="Pegá aquí el contenido del programa anual..."
          value={programaContenido}
          onChange={e => onContenidoChange(e.target.value)}
          rows={6}
          className="text-sm leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Archivo adjunto</Label>
        {programaArchivoNombre ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium truncate flex-1">{programaArchivoNombre}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onRemoveFile}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-colors">
            {uploadingFile ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{uploadingFile ? "Subiendo..." : "Subir archivo"}</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" onChange={onFileUpload} disabled={uploadingFile} />
          </label>
        )}
      </div>

      {programaContenido && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-semibold">Estructura del programa</Label>
          <EstructuraPrograma
            contenido={programaContenido}
            estructuraGuardada={programaEstructura}
            saving={savingEstructura}
            onSave={onSaveEstructura}
          />
        </div>
      )}

      {programaEstructura && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-semibold">Planificación anual</Label>
          <PlanificacionTimeline claseId={claseId} userId={userId} horario={horario} estructura={programaEstructura} />
        </div>
      )}
    </div>
  );
}
