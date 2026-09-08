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
      business_users: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          business_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          created_by: string
          debt_id: string
          id: string
          payment_method: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          created_by: string
          debt_id: string
          id?: string
          payment_method: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          created_by?: string
          debt_id?: string
          id?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount_paid: number
          business_id: string
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          sale_id: string
          status: string
          total_amount: number
        }
        Insert: {
          amount_paid?: number
          business_id: string
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          sale_id: string
          status?: string
          total_amount: number
        }
        Update: {
          amount_paid?: number
          business_id?: string
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          sale_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "debts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          display_order: number
          features: Json
          grace_period_days: number
          id: string
          limits: Json
          monthly_price: number
          name: string
          slug: string
          updated_at: string
          yearly_price: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          grace_period_days?: number
          id?: string
          limits?: Json
          monthly_price?: number
          name: string
          slug: string
          updated_at?: string
          yearly_price?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          features?: Json
          grace_period_days?: number
          id?: string
          limits?: Json
          monthly_price?: number
          name?: string
          slug?: string
          updated_at?: string
          yearly_price?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          active: boolean
          auth_user_id: string
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string
          category_id: string | null
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          selling_price: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          name: string
          selling_price: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          low_stock_threshold?: number
          name?: string
          selling_price?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_business_fkey"
            columns: ["category_id", "business_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "business_id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          payment_method: string
          status: string
          total_amount: number
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          id?: string
          payment_method: string
          status?: string
          total_amount?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          id?: string
          payment_method?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          id: string
          note: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          business_id: string | null
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          billing_cycle: string
          business_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          plan_id: string
          reference: string
          status: string
          subscription_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          business_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method: string
          plan_id: string
          reference: string
          status?: string
          subscription_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          business_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string
          plan_id?: string
          reference?: string
          status?: string
          subscription_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          billing_cycle: string
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          billing_cycle: string
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          billing_cycle?: string
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: {
          p_note?: string
          p_product_id: string
          p_quantity: number
          p_type: string
        }
        Returns: {
          business_id: string
          category_id: string | null
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          selling_price: number
          stock_quantity: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_subscription_payment: {
        Args: { p_confirm: boolean; p_notes?: string; p_payment_id: string }
        Returns: {
          amount: number
          billing_cycle: string
          business_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          plan_id: string
          reference: string
          status: string
          subscription_id: string
          transaction_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "subscription_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_business_with_admin: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          currency: string
          id: string
          name: string
          owner_id: string
        }
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_product: {
        Args: {
          p_business_id: string
          p_category_id: string
          p_cost_price: number
          p_initial_stock: number
          p_low_stock_threshold: number
          p_name: string
          p_selling_price: number
        }
        Returns: {
          business_id: string
          category_id: string | null
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean
          low_stock_threshold: number
          name: string
          selling_price: number
          stock_quantity: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_sale: {
        Args: {
          p_business_id: string
          p_customer_id: string
          p_items: Json
          p_payment_method: string
        }
        Returns: {
          business_id: string
          created_at: string
          created_by: string
          customer_id: string | null
          id: string
          payment_method: string
          status: string
          total_amount: number
        }
        SetofOptions: {
          from: "*"
          to: "sales"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_subscription_payment: {
        Args: {
          p_billing_cycle: string
          p_notes?: string
          p_payment_method: string
          p_plan_id: string
          p_transaction_id?: string
        }
        Returns: {
          amount: number
          billing_cycle: string
          business_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string
          plan_id: string
          reference: string
          status: string
          subscription_id: string
          transaction_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "subscription_payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_role: { Args: { p_business_id: string }; Returns: string }
      expire_due_subscriptions: { Args: never; Returns: number }
      has_active_subscription: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_member_of_business: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      register_debt_payment: {
        Args: { p_amount: number; p_debt_id: string; p_payment_method: string }
        Returns: {
          amount_paid: number
          business_id: string
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          sale_id: string
          status: string
          total_amount: number
        }
        SetofOptions: {
          from: "*"
          to: "debts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      require_active_subscription: {
        Args: { p_business_id: string }
        Returns: undefined
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
