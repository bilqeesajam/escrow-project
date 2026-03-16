export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          gig_id: string
          id: string
          raised_by: string
          reason: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          gig_id: string
          id?: string
          raised_by: string
          reason: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          gig_id?: string
          id?: string
          raised_by?: string
          reason?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          budget: number
          cart_value: number | null
          category: Database["public"]["Enums"]["gig_category"]
          client_confirmed: boolean
          client_id: string
          completion_pin: string | null
          created_at: string
          description: string | null
          hustler_confirmed: boolean
          hustler_id: string | null
          id: string
          location: string | null
          platform_fee_percentage: number | null
          pricing_adjustment_pct: number | null
          pricing_complexity_multiplier: number | null
          pricing_config_id: string | null
          pricing_fee: number | null
          pricing_inputs: Json | null
          pricing_snapshot: Json | null
          pricing_status: Database["public"]["Enums"]["pricing_approval_status"] | null
          pricing_subtotal: number | null
          pricing_total: number | null
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget: number
          cart_value?: number | null
          category?: Database["public"]["Enums"]["gig_category"]
          client_confirmed?: boolean
          client_id: string
          completion_pin?: string | null
          created_at?: string
          description?: string | null
          hustler_confirmed?: boolean
          hustler_id?: string | null
          id?: string
          location?: string | null
          platform_fee_percentage?: number | null
          pricing_adjustment_pct?: number | null
          pricing_complexity_multiplier?: number | null
          pricing_config_id?: string | null
          pricing_fee?: number | null
          pricing_inputs?: Json | null
          pricing_snapshot?: Json | null
          pricing_status?: Database["public"]["Enums"]["pricing_approval_status"] | null
          pricing_subtotal?: number | null
          pricing_total?: number | null
          status?: Database["public"]["Enums"]["gig_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number
          cart_value?: number | null
          category?: Database["public"]["Enums"]["gig_category"]
          client_confirmed?: boolean
          client_id?: string
          completion_pin?: string | null
          created_at?: string
          description?: string | null
          hustler_confirmed?: boolean
          hustler_id?: string | null
          id?: string
          location?: string | null
          platform_fee_percentage?: number | null
          pricing_adjustment_pct?: number | null
          pricing_complexity_multiplier?: number | null
          pricing_config_id?: string | null
          pricing_fee?: number | null
          pricing_inputs?: Json | null
          pricing_snapshot?: Json | null
          pricing_status?: Database["public"]["Enums"]["pricing_approval_status"] | null
          pricing_subtotal?: number | null
          pricing_total?: number | null
          status?: Database["public"]["Enums"]["gig_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_hustler_id_fkey"
            columns: ["hustler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gigs_pricing_config_id_fkey"
            columns: ["pricing_config_id"]
            isOneToOne: false
            referencedRelation: "pricing_config"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          gig_id: string | null
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gig_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          gig_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          base_hourly_rate: number
          category: Database["public"]["Enums"]["gig_category"]
          complexity_multipliers: Json
          created_at: string | null
          id: string
          max_budget: number
          min_budget: number
          per_km_rate: number
          platform_fee_percentage: number
          suggested_band_pct: number
          updated_at: string | null
          updated_by: string | null
          updated_reason: string | null
        }
        Insert: {
          base_hourly_rate: number
          category: Database["public"]["Enums"]["gig_category"]
          complexity_multipliers?: Json
          created_at?: string | null
          id?: string
          max_budget: number
          min_budget: number
          per_km_rate: number
          platform_fee_percentage: number
          suggested_band_pct?: number
          updated_at?: string | null
          updated_by?: string | null
          updated_reason?: string | null
        }
        Update: {
          base_hourly_rate?: number
          category?: Database["public"]["Enums"]["gig_category"]
          complexity_multipliers?: Json
          created_at?: string | null
          id?: string
          max_budget?: number
          min_budget?: number
          per_km_rate?: number
          platform_fee_percentage?: number
          suggested_band_pct?: number
          updated_at?: string | null
          updated_by?: string | null
          updated_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config_history: {
        Row: {
          after_data: Json | null
          before_data: Json | null
          change_reason: string
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          category: Database["public"]["Enums"]["gig_category"]
          pricing_config_id: string | null
        }
        Insert: {
          after_data?: Json | null
          before_data?: Json | null
          change_reason: string
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          category: Database["public"]["Enums"]["gig_category"]
          pricing_config_id?: string | null
        }
        Update: {
          after_data?: Json | null
          before_data?: Json | null
          change_reason?: string
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          category?: Database["public"]["Enums"]["gig_category"]
          pricing_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_config_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_config_history_pricing_config_id_fkey"
            columns: ["pricing_config_id"]
            isOneToOne: false
            referencedRelation: "pricing_config"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_overrides: {
        Row: {
          adjustment_pct: number
          admin_id: string | null
          admin_note: string | null
          category: Database["public"]["Enums"]["gig_category"]
          client_id: string
          created_at: string | null
          gig_id: string | null
          id: string
          reason: string | null
          requested_budget: number
          status: Database["public"]["Enums"]["pricing_override_status"]
          suggested_budget: number
          updated_at: string | null
        }
        Insert: {
          adjustment_pct: number
          admin_id?: string | null
          admin_note?: string | null
          category: Database["public"]["Enums"]["gig_category"]
          client_id: string
          created_at?: string | null
          gig_id?: string | null
          id?: string
          reason?: string | null
          requested_budget: number
          status?: Database["public"]["Enums"]["pricing_override_status"]
          suggested_budget: number
          updated_at?: string | null
        }
        Update: {
          adjustment_pct?: number
          admin_id?: string | null
          admin_note?: string | null
          category?: Database["public"]["Enums"]["gig_category"]
          client_id?: string
          created_at?: string | null
          gig_id?: string | null
          id?: string
          reason?: string | null
          requested_budget?: number
          status?: Database["public"]["Enums"]["pricing_override_status"]
          suggested_budget?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_overrides_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_overrides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_overrides_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          full_name: string | null
          id: string
          id_number: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string | null
          id: string
          id_number?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string | null
          id?: string
          id_number?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          fee_amount: number | null
          fee_percentage: number | null
          from_user_id: string | null
          gig_id: string | null
          id: string
          note: string | null
          subtotal_amount: number | null
          to_user_id: string | null
          total_amount: number | null
          type: Database["public"]["Enums"]["txn_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          fee_amount?: number | null
          fee_percentage?: number | null
          from_user_id?: string | null
          gig_id?: string | null
          id?: string
          note?: string | null
          subtotal_amount?: number | null
          to_user_id?: string | null
          total_amount?: number | null
          type: Database["public"]["Enums"]["txn_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          fee_amount?: number | null
          fee_percentage?: number | null
          from_user_id?: string | null
          gig_id?: string | null
          id?: string
          note?: string | null
          subtotal_amount?: number | null
          to_user_id?: string | null
          total_amount?: number | null
          type?: Database["public"]["Enums"]["txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_kyc_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["kyc_status"]
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gig_participant: {
        Args: { _gig_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_client"
        | "resolved_hustler"
      gig_category: "errand" | "pickup" | "delivery" | "shopping" | "other"
      gig_status:
        | "open"
        | "accepted"
        | "in_progress"
        | "pending_confirmation"
        | "completed"
        | "disputed"
        | "cancelled"
      kyc_status: "pending" | "approved" | "rejected"
      pricing_approval_status: "auto_approved" | "pending_review" | "approved" | "rejected"
      pricing_override_status: "pending" | "approved" | "rejected"
      txn_type: "hold" | "release" | "refund" | "top_up"
      user_role: "client" | "hustler" | "admin"
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
      dispute_status: [
        "open",
        "under_review",
        "resolved_client",
        "resolved_hustler",
      ],
      gig_category: ["errand", "pickup", "delivery", "shopping", "other"],
      gig_status: [
        "open",
        "accepted",
        "in_progress",
        "pending_confirmation",
        "completed",
        "disputed",
        "cancelled",
      ],
      kyc_status: ["pending", "approved", "rejected"],
      pricing_approval_status: ["auto_approved", "pending_review", "approved", "rejected"],
      pricing_override_status: ["pending", "approved", "rejected"],
      txn_type: ["hold", "release", "refund", "top_up"],
      user_role: ["client", "hustler", "admin"],
    },
  },
} as const