import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { StudentDetailSheet } from "@/components/clase/StudentDetailSheet";
import { ClaseHeader } from "@/components/clase/ClaseHeader";
import { ResumenTab } from "@/components/clase/tabs/ResumenTab";
import { AsistenciaTab } from "@/components/clase/tabs/AsistenciaTab";
import { NotasTab } from "@/components/clase/tabs/NotasTab";
import { ObservacionesTab } from "@/components/clase/tabs/ObservacionesTab";
import { DiarioTab } from "@/components/clase/tabs/DiarioTab";
import { DesempenoTab } from "@/components/clase/tabs/DesempenoTab";
import { ProgramaTab } from "@/components/clase/tabs/ProgramaTab";
import { TareaSheet } from "@/components/clase/tabs/TareaSheet";
import { EditClaseDialog } from "@/components/clase/EditClaseDialog";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useClaseData } from "@/hooks/clase/useClaseData";
import { useDateSelector } from "@/hooks/clase/useDateSelector";
import { usePlanificacion } from "@/hooks/clase/usePlanificacion";
import { useAsistencia } from "@/hooks/clase/useAsistencia";
import { useDesempeno } from "@/hooks/clase/useDesempeno";
import { useNotas } from "@/hooks/clase/useNotas";
import { useObservaciones } from "@/hooks/clase/useObservaciones";
import { useDiario } from "@/hooks/clase/useDiario";
import { usePrograma } from "@/hooks/clase/usePrograma";
import type { ModoActivo, TabBadges } from "@/components/clase/types";
import { toast } from "sonner";

export default function ModoClase() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { loading, clase, materia, grupo, estudiantes, evaluaciones, updateClase } = useClaseData(claseId, user?.id);
  const { selectedDate, selectedDateISO, isReadonly, isPastDate, handleDateChange } = useDateSelector();

  const plan = usePlanificacion(claseId, selectedDateISO);

  const asistencia = useAsistencia(claseId, user?.id, estudiantes, selectedDateISO, isReadonly);
  const desempeno = useDesempeno(claseId, user?.id, estudiantes, selectedDateISO);
  const notas = useNotas(claseId, user?.id, evaluaciones);
  const obs = useObservaciones(claseId, user?.id, selectedDateISO);
  const diario = useDiario(
    claseId, user?.id, selectedDateISO, isReadonly,
    plan.temaPlanificado, plan.setPlanEstado,
  );
  const programa = usePrograma(claseId, user?.id);

  // Simple local UI state
  const [modoActivo, setModoActivo] = useState<ModoActivo>("resumen");
  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);
  const [tareaSheetOpen, setTareaSheetOpen] = useState(false);
  const [editClaseOpen, setEditClaseOpen] = useState(false);

  const handleModoChange = (modo: ModoActivo) => {
    setModoActivo(modo);
  };

  const onDateChange = (date: Date) => {
    handleDateChange(date);
    setModoActivo("resumen");
  };

  // Current save status for header indicator
  const currentStatus = modoActivo === "asistencia" ? asistencia.saveStatus
    : modoActivo === "notas" ? notas.saveStatus
    : modoActivo === "observaciones" ? obs.saveStatus
    : modoActivo === "diario" ? diario.saveStatus
    : modoActivo === "desempeno" ? desempeno.desempenoSaveStatus
    : modoActivo === "programa" ? programa.saveStatus : "idle";

  const tabBadges = useMemo<TabBadges>(() => {
    const desCount = Object.values(desempeno.desempeno).filter(
      d => d.tarea || d.participacion_oral || d.rendimiento_aula || d.conducta
    ).length;
    return {
      asistencia: {
        complete: estudiantes.length > 0 && Object.values(asistencia.asistencia).filter(Boolean).length === estudiantes.length,
        missing: estudiantes.length - Object.values(asistencia.asistencia).filter(Boolean).length,
      },
      notas: {
        sinNota: notas.evaluacionActiva
          ? estudiantes.filter(e => !notas.notasState[`${notas.evaluacionActiva}-${e.id}`]?.trim()).length
          : 0,
      },
      observaciones: { count: obs.obsStats },
      diario: { complete: !!diario.diarioTema.trim() },
      desempeno: { count: desCount, total: estudiantes.length },
      programa: { hasContent: !!programa.programaEstructura },
    };
  }, [estudiantes, asistencia.asistencia, notas.notasState, notas.evaluacionActiva, obs.obsStats, diario.diarioTema, desempeno.desempeno, programa.programaEstructura]);

  // ========== RENDER ==========
  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!clase || !grupo || !materia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Clase no encontrada</p>
        <Button variant="outline" onClick={() => navigate("/")}>Volver al panel</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <ClaseHeader
        materiaName={materia.nombre}
        grupoName={grupo.nombre}
        horario={clase.horario}
        aula={clase.aula}
        studentCount={estudiantes.length}
        modoActivo={modoActivo}
        selectedDate={selectedDate}
        isReadonly={isReadonly}
        isPastDate={isPastDate}
        saveStatus={currentStatus}
        tabBadges={tabBadges}
        onBack={() => navigate(-1)}
        onEditClase={() => setEditClaseOpen(true)}
        onModoChange={handleModoChange}
        onDateChange={onDateChange}
      />

      {modoActivo === "resumen" && (
        <ResumenTab
          temaPlanificado={plan.temaPlanificado}
          planEstado={plan.planEstado}
          asistenciaStats={asistencia.stats}
          desempenoCount={tabBadges.desempeno.count}
          desempenoTotal={tabBadges.desempeno.total}
          evaluacionesCount={evaluaciones.length}
          obsStats={obs.obsStats}
          diarioTema={diario.diarioTema}
          planificacionStats={plan.planificacionStats}
          onNavigate={setModoActivo}
        />
      )}

      {modoActivo === "asistencia" && (
        <AsistenciaTab
          estudiantes={estudiantes}
          asistencia={asistencia.asistencia}
          motivos={asistencia.motivos}
          stats={asistencia.stats}
          isReadonly={isReadonly}
          onMarcarAsistencia={asistencia.marcarAsistencia}
          onMarcarTodosPresentes={asistencia.marcarTodosPresentes}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "desempeno" && (
        <DesempenoTab
          estudiantes={estudiantes}
          desempeno={desempeno.desempeno}
          isReadonly={isReadonly}
          hasTareaHoy={plan.hasTareaHoy}
          onCambiarDesempeno={desempeno.cambiarDesempeno}
          onMarcarTodosA={desempeno.marcarTodosDesempenoA}
          onStudentDetail={setStudentDetailId}
          onTareaHeaderClick={() => setTareaSheetOpen(true)}
        />
      )}

      {modoActivo === "notas" && (
        <NotasTab
          estudiantes={estudiantes}
          evaluaciones={evaluaciones}
          evaluacionActiva={notas.evaluacionActiva}
          notasState={notas.notasState}
          isReadonly={isReadonly}
          onEvaluacionChange={notas.setEvaluacionActiva}
          onNotaChange={notas.handleNotaChange}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "observaciones" && (
        <ObservacionesTab
          estudiantes={estudiantes}
          obsState={obs.obsState}
          obsStats={obs.obsStats}
          isReadonly={isReadonly}
          onToggleObservacion={obs.toggleObservacion}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "diario" && (
        <DiarioTab
          diarioTema={diario.diarioTema}
          diarioActividad={diario.diarioActividad}
          diarioObs={diario.diarioObs}
          temaPlanificado={plan.temaPlanificado}
          planEstado={plan.planEstado}
          diarioSugerencias={diario.diarioSugerencias}
          isReadonly={isReadonly}
          planificacionStats={plan.planificacionStats}
          onChange={diario.handleDiarioChange}
          onChangePlanEstado={async (estado) => {
            if (!claseId) return;
            const { data: todayPlan } = await supabase
              .from("planificacion_clases").select("id")
              .eq("clase_id", claseId).eq("fecha", selectedDateISO);
            if (todayPlan && todayPlan.length > 0) {
              await supabase.from("planificacion_clases")
                .update({ estado: estado as Enums<"estado_planificacion">, diario_id: diario.diarioId })
                .eq("id", todayPlan[0].id);
              plan.setPlanEstado(estado);
              await plan.refreshStats();
              toast.success("Estado actualizado");
            }
          }}
          onNavigatePrograma={() => setModoActivo("programa")}
        />
      )}

      {modoActivo === "programa" && (
        <ProgramaTab
          claseId={claseId!}
          userId={user!.id}
          horario={clase?.horario || null}
          programaContenido={programa.programaContenido}
          programaArchivoUrl={programa.programaArchivoUrl}
          programaArchivoNombre={programa.programaArchivoNombre}
          programaEstructura={programa.programaEstructura}
          uploadingFile={programa.uploadingFile}
          savingEstructura={programa.savingEstructura}
          onContenidoChange={programa.handleProgramaChange}
          onFileUpload={programa.handleProgramaFileUpload}
          onRemoveFile={programa.handleRemoveFile}
          onSaveEstructura={programa.handleSaveEstructura}
        />
      )}

      <StudentDetailSheet
        studentId={studentDetailId}
        claseId={claseId || ""}
        open={!!studentDetailId}
        onClose={() => setStudentDetailId(null)}
      />

      <TareaSheet
        open={tareaSheetOpen}
        onClose={() => setTareaSheetOpen(false)}
        claseId={claseId!}
        userId={user!.id}
        fecha={selectedDateISO}
        isReadonly={isReadonly}
        onTareaChange={plan.setHasTareaHoy}
      />

      <EditClaseDialog
        open={editClaseOpen}
        horario={clase?.horario || null}
        aula={clase?.aula || null}
        claseId={claseId!}
        onClose={() => setEditClaseOpen(false)}
        onSaved={(patch) => updateClase(patch)}
      />
    </div>
  );
}
