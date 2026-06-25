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
      buildings: {
        Row: {
          address: string
          city: string
          created_at: string | null
          floor_count: number | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          photo_url: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          floor_count?: number | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          floor_count?: number | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          photo_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          building_id: string | null
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          lease_id: string | null
          storage_path: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["document_type"]
          unit_id: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          lease_id?: string | null
          storage_path: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["document_type"]
          unit_id?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          lease_id?: string | null
          storage_path?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["document_type"]
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          billable: boolean | null
          building_id: string | null
          created_at: string | null
          expense_date: string
          id: string
          label: string
          notes: string | null
          type: Database["public"]["Enums"]["expense_type"]
          unit_id: string | null
        }
        Insert: {
          amount: number
          billable?: boolean | null
          building_id?: string | null
          created_at?: string | null
          expense_date: string
          id?: string
          label: string
          notes?: string | null
          type: Database["public"]["Enums"]["expense_type"]
          unit_id?: string | null
        }
        Update: {
          amount?: number
          billable?: boolean | null
          building_id?: string | null
          created_at?: string | null
          expense_date?: string
          id?: string
          label?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["expense_type"]
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          deposit: number | null
          deposit_returned: boolean | null
          end_date: string | null
          id: string
          rent_excl_tax: number
          rent_incl_tax: number | null
          special_conditions: string | null
          start_date: string
          status: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          unit_id: string
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          deposit?: number | null
          deposit_returned?: boolean | null
          end_date?: string | null
          id?: string
          rent_excl_tax: number
          rent_incl_tax?: number | null
          special_conditions?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          unit_id: string
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          deposit?: number | null
          deposit_returned?: boolean | null
          end_date?: string | null
          id?: string
          rent_excl_tax?: number
          rent_incl_tax?: number | null
          special_conditions?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id?: string
          unit_id?: string
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          error_message: string | null
          id: string
          recipient: string
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["notification_status"] | null
          subject: string | null
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          subject?: string | null
        }
        Relationships: []
      }
      owners: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          payment_reference: string | null
          rent_due_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date: string
          payment_reference?: string | null
          rent_due_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          payment_reference?: string | null
          rent_due_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_rent_due_id_fkey"
            columns: ["rent_due_id"]
            isOneToOne: false
            referencedRelation: "rent_dues"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_dues: {
        Row: {
          amount_excl_tax: number
          amount_incl_tax: number
          created_at: string | null
          due_month: string
          id: string
          lease_id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          vat_amount: number
        }
        Insert: {
          amount_excl_tax: number
          amount_incl_tax: number
          created_at?: string | null
          due_month: string
          id?: string
          lease_id: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          vat_amount: number
        }
        Update: {
          amount_excl_tax?: number
          amount_incl_tax?: number
          created_at?: string | null
          due_month?: string
          id?: string
          lease_id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "rent_dues_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string
          national_id: string | null
          notes: string | null
          phone: string
          previous_address: string | null
          tax_id: string | null
          tenant_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name: string
          national_id?: string | null
          notes?: string | null
          phone: string
          previous_address?: string | null
          tax_id?: string | null
          tenant_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string
          national_id?: string | null
          notes?: string | null
          phone?: string
          previous_address?: string | null
          tax_id?: string | null
          tenant_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          area_sqm: number | null
          base_rent: number | null
          building_id: string
          created_at: string | null
          description: string | null
          floor: number | null
          id: string
          monthly_charges: number | null
          reference: string
          room_count: number | null
          status: Database["public"]["Enums"]["unit_status"] | null
          type: Database["public"]["Enums"]["unit_type"]
          updated_at: string | null
        }
        Insert: {
          area_sqm?: number | null
          base_rent?: number | null
          building_id: string
          created_at?: string | null
          description?: string | null
          floor?: number | null
          id?: string
          monthly_charges?: number | null
          reference: string
          room_count?: number | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Update: {
          area_sqm?: number | null
          base_rent?: number | null
          building_id?: string
          created_at?: string | null
          description?: string | null
          floor?: number | null
          id?: string
          monthly_charges?: number | null
          reference?: string
          room_count?: number | null
          status?: Database["public"]["Enums"]["unit_status"] | null
          type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_stats: {
        Row: {
          collected_rent_this_month: number | null
          expected_rent_this_month: number | null
          occupied_units: number | null
          total_units: number | null
          total_unpaid: number | null
          vacant_units: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_type:
        | "national_id"
        | "business_registration"
        | "tax_id"
        | "signed_lease"
        | "receipt"
        | "invoice"
        | "other"
      expense_type:
        | "water"
        | "electricity"
        | "syndicate"
        | "maintenance"
        | "tax"
        | "other"
      lease_status: "active" | "expired" | "terminated" | "draft"
      notification_channel: "email" | "sms" | "whatsapp"
      notification_status: "pending" | "sent" | "failed"
      payment_method: "cash" | "bank_transfer" | "check" | "direct_debit"
      payment_status: "paid" | "partial" | "unpaid" | "overdue"
      unit_status: "vacant" | "occupied" | "under_renovation"
      unit_type: "apartment" | "office" | "shop" | "parking" | "storage"
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
      document_type: [
        "national_id",
        "business_registration",
        "tax_id",
        "signed_lease",
        "receipt",
        "invoice",
        "other",
      ],
      expense_type: [
        "water",
        "electricity",
        "syndicate",
        "maintenance",
        "tax",
        "other",
      ],
      lease_status: ["active", "expired", "terminated", "draft"],
      notification_channel: ["email", "sms", "whatsapp"],
      notification_status: ["pending", "sent", "failed"],
      payment_method: ["cash", "bank_transfer", "check", "direct_debit"],
      payment_status: ["paid", "partial", "unpaid", "overdue"],
      unit_status: ["vacant", "occupied", "under_renovation"],
      unit_type: ["apartment", "office", "shop", "parking", "storage"],
    },
  },
} as const
