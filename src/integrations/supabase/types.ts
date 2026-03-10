export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      asistencia: {
        Row: {
          clase_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_asistencia"]
          estudiante_id: string
          fecha: string
          id: string
          user_id: string
        }
        Insert: {
          clase_id: string
          created_at?: string
          estado: Database["public"]["Enums"]["estado_asistencia"]
          estudiante_id: string
          fecha: string
          id?: string
          user_id: string
        }
        Update: {
          clase_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_asistencia"]
          estudiante_id?: string
          fecha?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
        ]
      }
      clases: {
        Row: {
          aula: string | null
          created_at: string
          grupo_id: string
          horario: string | null
          id: string
          materia_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aula?: string | null
          created_at?: string
          grupo_id: string
          horario?: string | null
          id?: string
          materia_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aula?: string | null
          created_at?: string
          grupo_id?: string
          horario?: string | null
          id?: string
          materia_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clases_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_clase: {
        Row: {
          actividad_realizada: string | null
          clase_id: string
          created_at: string
          fecha: string
          id: string
          observaciones: string | null
          tema_trabajado: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actividad_realizada?: string | null
          clase_id: string
          created_at?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          tema_trabajado?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actividad_realizada?: string | null
          clase_id?: string
          created_at?: string
          fecha?: string
          id?: string
          observaciones?: string | null
          tema_trabajado?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diario_clase_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_entrega"]
          estudiante_id: string
          id: string
          tarea_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_entrega"]
          estudiante_id: string
          id?: string
          tarea_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_entrega"]
          estudiante_id?: string
          id?: string
          tarea_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entregas_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entregas_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      estudiantes: {
        Row: {
          apellido: string | null
          created_at: string
          foto_url: string | null
          grupo_id: string
          id: string
          nombre_completo: string
          numero_lista: number | null
          observaciones: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido?: string | null
          created_at?: string
          foto_url?: string | null
          grupo_id: string
          id?: string
          nombre_completo: string
          numero_lista?: number | null
          observaciones?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string | null
          created_at?: string
          foto_url?: string | null
          grupo_id?: string
          id?: string
          nombre_completo?: string
          numero_lista?: number | null
          observaciones?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudiantes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          clase_id: string
          created_at: string
          fecha: string | null
          id: string
          nombre: string
          peso: number | null
          tipo: Database["public"]["Enums"]["tipo_evaluacion"]
          updated_at: string
          user_id: string
        }
        Insert: {
          clase_id: string
          created_at?: string
          fecha?: string | null
          id?: string
          nombre: string
          peso?: number | null
          tipo: Database["public"]["Enums"]["tipo_evaluacion"]
          updated_at?: string
          user_id: string
        }
        Update: {
          clase_id?: string
          created_at?: string
          fecha?: string | null
          id?: string
          nombre?: string
          peso?: number | null
          tipo?: Database["public"]["Enums"]["tipo_evaluacion"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_colaboradores: {
        Row: {
          colaborador_user_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_invitacion"]
          grupo_id: string
          id: string
          owner_user_id: string
        }
        Insert: {
          colaborador_user_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_invitacion"]
          grupo_id: string
          id?: string
          owner_user_id: string
        }
        Update: {
          colaborador_user_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_invitacion"]
          grupo_id?: string
          id?: string
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_colaboradores_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          anio: string | null
          created_at: string
          id: string
          institucion_id: string
          nombre: string
          turno: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anio?: string | null
          created_at?: string
          id?: string
          institucion_id: string
          nombre: string
          turno?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anio?: string | null
          created_at?: string
          id?: string
          institucion_id?: string
          nombre?: string
          turno?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      instituciones: {
        Row: {
          ciudad: string | null
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materias: {
        Row: {
          color: string | null
          created_at: string
          id: string
          institucion_id: string | null
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          institucion_id?: string | null
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          institucion_id?: string | null
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materias_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      notas: {
        Row: {
          created_at: string
          estudiante_id: string
          evaluacion_id: string
          id: string
          nota: number | null
          observacion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estudiante_id: string
          evaluacion_id: string
          id?: string
          nota?: number | null
          observacion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estudiante_id?: string
          evaluacion_id?: string
          id?: string
          nota?: number | null
          observacion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      observaciones: {
        Row: {
          clase_id: string
          created_at: string
          descripcion: string
          estudiante_id: string
          fecha: string
          id: string
          tipo: Database["public"]["Enums"]["tipo_observacion"]
          user_id: string
        }
        Insert: {
          clase_id: string
          created_at?: string
          descripcion: string
          estudiante_id: string
          fecha?: string
          id?: string
          tipo: Database["public"]["Enums"]["tipo_observacion"]
          user_id: string
        }
        Update: {
          clase_id?: string
          created_at?: string
          descripcion?: string
          estudiante_id?: string
          fecha?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_observacion"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observaciones_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          analisis_completo: boolean
          comentarios_ia: boolean
          exportacion: boolean
          informes_avanzados: boolean
          max_estudiantes_por_grupo: number
          max_grupos: number
          plan: string
        }
        Insert: {
          analisis_completo?: boolean
          comentarios_ia?: boolean
          exportacion?: boolean
          informes_avanzados?: boolean
          max_estudiantes_por_grupo: number
          max_grupos: number
          plan: string
        }
        Update: {
          analisis_completo?: boolean
          comentarios_ia?: boolean
          exportacion?: boolean
          informes_avanzados?: boolean
          max_estudiantes_por_grupo?: number
          max_grupos?: number
          plan?: string
        }
        Relationships: []
      }
      planificacion_clases: {
        Row: {
          clase_id: string
          created_at: string
          diario_id: string | null
          estado: Database["public"]["Enums"]["estado_planificacion"]
          fecha: string
          id: string
          notas: string | null
          tema_index: number
          tema_titulo: string
          unidad_index: number
          unidad_titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clase_id: string
          created_at?: string
          diario_id?: string | null
          estado?: Database["public"]["Enums"]["estado_planificacion"]
          fecha: string
          id?: string
          notas?: string | null
          tema_index: number
          tema_titulo: string
          unidad_index: number
          unidad_titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clase_id?: string
          created_at?: string
          diario_id?: string | null
          estado?: Database["public"]["Enums"]["estado_planificacion"]
          fecha?: string
          id?: string
          notas?: string | null
          tema_index?: number
          tema_titulo?: string
          unidad_index?: number
          unidad_titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planificacion_clases_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planificacion_clases_diario_id_fkey"
            columns: ["diario_id"]
            isOneToOne: false
            referencedRelation: "diario_clase"
            referencedColumns: ["id"]
          },
        ]
      }
      profesor_institucion: {
        Row: {
          created_at: string
          id: string
          institucion_id: string
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institucion_id: string
          rol?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institucion_id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesor_institucion_institucion_id_fkey"
            columns: ["institucion_id"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nombre: string
          plan: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          plan?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          plan?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programas_anuales: {
        Row: {
          archivo_nombre: string | null
          archivo_url: string | null
          clase_id: string
          contenido: string | null
          contenido_estructurado: Json | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          clase_id: string
          contenido?: string | null
          contenido_estructurado?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          clase_id?: string
          contenido?: string | null
          contenido_estructurado?: Json | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programas_anuales_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          clase_id: string
          created_at: string
          descripcion: string | null
          fecha_entrega: string | null
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clase_id: string
          created_at?: string
          descripcion?: string | null
          fecha_entrega?: string | null
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clase_id?: string
          created_at?: string
          descripcion?: string | null
          fecha_entrega?: string | null
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_grupo_colaborador: {
        Args: { _grupo_id: string; _user_id: string }
        Returns: boolean
      }
      is_institucion_member: {
        Args: { _institucion_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "docente"
      estado_asistencia: "presente" | "falta" | "tarde" | "retiro"
      estado_entrega: "entregado" | "no_entregado"
      estado_invitacion: "pendiente" | "aceptada" | "rechazada"
      estado_planificacion:
        | "pendiente"
        | "completado"
        | "parcial"
        | "suspendido"
        | "reprogramado"
      tipo_evaluacion:
        | "prueba_escrita"
        | "oral"
        | "trabajo_practico"
        | "laboratorio"
        | "tarea"
        | "evaluacion_formativa"
      tipo_observacion:
        | "participacion"
        | "actitud"
        | "cumplimiento_tareas"
        | "dificultad_contenidos"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "docente"],
      estado_asistencia: ["presente", "falta", "tarde", "retiro"],
      estado_entrega: ["entregado", "no_entregado"],
      estado_invitacion: ["pendiente", "aceptada", "rechazada"],
      estado_planificacion: [
        "pendiente",
        "completado",
        "parcial",
        "suspendido",
        "reprogramado",
      ],
      tipo_evaluacion: [
        "prueba_escrita",
        "oral",
        "trabajo_practico",
        "laboratorio",
        "tarea",
        "evaluacion_formativa",
      ],
      tipo_observacion: [
        "participacion",
        "actitud",
        "cumplimiento_tareas",
        "dificultad_contenidos",
      ],
    },
  },
} as const
