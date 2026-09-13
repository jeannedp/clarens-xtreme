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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      config_types: {
        Row: {
          config_type_id: string
          config_type_name: string
          is_active: boolean
        }
        Insert: {
          config_type_id?: string
          config_type_name: string
          is_active?: boolean
        }
        Update: {
          config_type_id?: string
          config_type_name?: string
          is_active?: boolean
        }
        Relationships: []
      }
      configs: {
        Row: {
          config_description: string
          config_id: string
          config_name: string
          config_type_id: string
          config_value: Json | null
          created_at: string
        }
        Insert: {
          config_description: string
          config_id?: string
          config_name: string
          config_type_id: string
          config_value?: Json | null
          created_at?: string
        }
        Update: {
          config_description?: string
          config_id?: string
          config_name?: string
          config_type_id?: string
          config_value?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_config_type_id_fkey"
            columns: ["config_type_id"]
            isOneToOne: false
            referencedRelation: "config_types"
            referencedColumns: ["config_type_id"]
          },
        ]
      }
      device_types: {
        Row: {
          device_type_id: string
          device_type_name: string
          is_active: boolean
        }
        Insert: {
          device_type_id?: string
          device_type_name: string
          is_active?: boolean
        }
        Update: {
          device_type_id?: string
          device_type_name?: string
          is_active?: boolean
        }
        Relationships: []
      }
      devices: {
        Row: {
          device_id: string
          device_name: string
          device_type_id: string
          is_active: boolean
        }
        Insert: {
          device_id: string
          device_name: string
          device_type_id: string
          is_active?: boolean
        }
        Update: {
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
          created_at: string
          description: string
          event_log_id: string
          event_type: string
          headers: Json | null
          query: Json | null
          source: string
        }
        Insert: {
          created_at?: string
          description: string
          event_log_id?: string
          event_type: string
          headers?: Json | null
          query?: Json | null
          source: string
        }
        Update: {
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
          heartbeat_epc: string
          is_active: boolean
          reader_id: string
          reader_name: string
        }
        Insert: {
          heartbeat_epc: string
          is_active?: boolean
          reader_id: string
          reader_name: string
        }
        Update: {
          heartbeat_epc?: string
          is_active?: boolean
          reader_id?: string
          reader_name?: string
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
      card_totals_logs: {
        Row: {
          device_id: string | null
          device_type_id: string | null
          event_timestamp: string | null
          is_heartbeat: boolean | null
          is_unknown: boolean | null
          reader_id: string | null
          received_at: string | null
          session_key: string | null
          tracking_log_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["device_type_id"]
          },
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
      rides_per_day: {
        Row: {
          ride_day: string | null
          rides: number | null
        }
        Relationships: []
      }
      rides_per_gear: {
        Row: {
          device_id: string | null
          device_name: string | null
          device_type_id: string | null
          ride_day: string | null
          rides: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["device_type_id"]
          },
          {
            foreignKeyName: "tracking_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["device_id"]
          },
        ]
      }
      session_logs: {
        Row: {
          device_id: string | null
          device_name: string | null
          device_type_id: string | null
          reader_id: string | null
          reader_name: string | null
          server_end: string | null
          server_start: string | null
          session_end: string | null
          session_start: string | null
          signal_strength: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_device_type_id_fkey"
            columns: ["device_type_id"]
            isOneToOne: false
            referencedRelation: "device_types"
            referencedColumns: ["device_type_id"]
          },
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
      settings: {
        Row: {
          settings: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
