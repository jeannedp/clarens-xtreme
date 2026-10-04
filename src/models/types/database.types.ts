export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      device_types: {
        Row: {
          created_at: string
          device_type_id: string
          device_type_name: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          device_type_id?: string
          device_type_name: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          device_type_id?: string
          device_type_name?: string
          is_active?: boolean
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          device_type_id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name: string
          device_type_id: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string
          device_type_id?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "devices_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["device_type_id"]
          },
        ]
      }
      event_logs: {
        Row: {
          body: Json | null
          created_at: string
          description: string
          event_log_id: string
          event_type: string
          headers: Json | null
          query: Json | null
          source: string
        }
        Insert: {
          body?: Json | null
          created_at?: string
          description: string
          event_log_id?: string
          event_type: string
          headers?: Json | null
          query?: Json | null
          source: string
        }
        Update: {
          body?: Json | null
          created_at?: string
          description?: string
          event_log_id?: string
          event_type?: string
          headers?: Json | null
          query?: Json | null
          source?: string
        }
        Relationships: []
      }
      readers: {
        Row: {
          created_at: string
          heartbeat_epc: string
          is_active: boolean
          reader_id: string
          reader_name: string
        }
        Insert: {
          created_at?: string
          heartbeat_epc: string
          is_active?: boolean
          reader_id: string
          reader_name: string
        }
        Update: {
          created_at?: string
          heartbeat_epc?: string
          is_active?: boolean
          reader_id?: string
          reader_name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          heartbeat_offline: number
          heartbeat_stale: number
          min_session_duration: number
          min_session_reads: number
          session_gap: number
          setting_id: string
          setting_name: string
          updated_at: string
        }
        Insert: {
          heartbeat_offline?: number
          heartbeat_stale?: number
          min_session_duration?: number
          min_session_reads?: number
          session_gap?: number
          setting_id?: string
          setting_name: string
          updated_at?: string
        }
        Update: {
          heartbeat_offline?: number
          heartbeat_stale?: number
          min_session_duration?: number
          min_session_reads?: number
          session_gap?: number
          setting_id?: string
          setting_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracking_logs: {
        Row: {
          average_signal_strength: number | null
          device_id: string | null
          event_timestamp: string | null
          reader_epc: string | null
          reader_id: string | null
          received_at: string
          tracking_log_id: string
        }
        Insert: {
          average_signal_strength?: number | null
          device_id?: string | null
          event_timestamp?: string | null
          reader_epc?: string | null
          reader_id?: string | null
          received_at?: string
          tracking_log_id?: string
        }
        Update: {
          average_signal_strength?: number | null
          device_id?: string | null
          event_timestamp?: string | null
          reader_epc?: string | null
          reader_id?: string | null
          received_at?: string
          tracking_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "tracking_logs_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "readers"
            referencedColumns: ["reader_id"]
          },
        ]
      }
    }
    Views: {
      filters: {
        Row: {
          dates: Json | null
          device_types: Json | null
          devices: Json | null
          readers: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_sessions: {
        Args: { p_setting_id?: string }
        Returns: {
          device_id: string
          device_name: string
          device_type_id: string
          device_type_name: string
          reader_id: string
          reader_name: string
          session_end: string
          session_start: string
          signal_strength: number
          total_reads: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

