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
      grupos: {
        Row: {
          anio: string | null
          created_at: string
          id: string
          nombre: string
          turno: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anio?: string | null
          created_at?: string
          id?: string
          nombre: string
          turno?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anio?: string | null
          created_at?: string
          id?: string
          nombre?: string
          turno?: string | null
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
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_asistencia: "presente" | "falta" | "tarde" | "retiro"
      estado_entrega: "entregado" | "no_entregado"
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
      estado_asistencia: ["presente", "falta", "tarde", "retiro"],
      estado_entrega: ["entregado", "no_entregado"],
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
