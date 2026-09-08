/**
 * Tipos manuais da Fase 1. Assim que o projeto Supabase estiver criado e
 * ligado, substituir por tipos gerados automaticamente:
 *
 *   npx supabase gen types typescript --project-id <ID> > src/lib/types/database.types.ts
 *
 * Manter esta estrutura ({ public: { Tables: {...} } }) para compatibilidade
 * com createBrowserClient<Database> / createServerClient<Database>.
 */
export type UserRole = "admin" | "funcionario";
export type StockMovementType = "entrada" | "venda" | "ajuste";
export type SalePaymentMethod = "pago" | "credito";
export type SaleStatus = "concluida";
export type DebtStatus = "pendente" | "parcial" | "paga" | "vencida";
export type DebtPaymentMethod = "dinheiro" | "mpesa" | "emola" | "transferencia" | "outro";
export type SubscriptionStatus = "pending" | "active" | "past_due" | "expired" | "cancelled" | "suspended";
export type SubscriptionPaymentStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "refunded";
export type BillingCycle = "monthly" | "yearly";


export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          currency: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          owner_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      business_users: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          category_id: string | null;
          name: string;
          cost_price: number | null;
          selling_price: number;
          stock_quantity: number;
          low_stock_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          category_id?: string | null;
          name: string;
          cost_price?: number | null;
          selling_price: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          business_id: string;
          product_id: string;
          type: StockMovementType;
          quantity: number;
          note: string | null;
          reference_type: string | null;
          reference_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          product_id: string;
          type: StockMovementType;
          quantity: number;
          note?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string | null;
          total_amount: number;
          payment_method: SalePaymentMethod;
          status: SaleStatus;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id?: string | null;
          total_amount?: number;
          payment_method: SalePaymentMethod;
          status?: SaleStatus;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
        Relationships: [];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>;
        Relationships: [];
      };
      debts: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          sale_id: string;
          total_amount: number;
          amount_paid: number;
          status: DebtStatus;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          sale_id: string;
          total_amount: number;
          amount_paid?: number;
          status?: DebtStatus;
          due_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["debts"]["Insert"]>;
        Relationships: [];
      };
      debt_payments: {
        Row: {
          id: string;
          business_id: string;
          debt_id: string;
          amount: number;
          payment_method: DebtPaymentMethod;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          debt_id: string;
          amount: number;
          payment_method: DebtPaymentMethod;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["debt_payments"]["Insert"]>;
        Relationships: [];
      };
      plans: { Row: { id:string; name:string; slug:string; description:string|null; monthly_price:number; yearly_price:number; currency:string; active:boolean; display_order:number; limits: Record<string, unknown>; features: string[]; grace_period_days:number; created_at:string; updated_at:string }; Insert: any; Update: any; Relationships: [] };
      subscriptions: { Row: { id:string; business_id:string; plan_id:string; billing_cycle:BillingCycle; status:SubscriptionStatus; start_date:string|null; current_period_start:string|null; current_period_end:string|null; auto_renew:boolean; cancelled_at:string|null; cancellation_reason:string|null; created_at:string; updated_at:string }; Insert:any; Update:any; Relationships: [] };
      subscription_payments: { Row: { id:string; business_id:string; subscription_id:string; plan_id:string; amount:number; currency:string; billing_cycle:BillingCycle; payment_method:"mpesa"|"emola"|"mkesh"|"bank_transfer"|"cash"|"other"; status:SubscriptionPaymentStatus; reference:string; transaction_id:string|null; notes:string|null; paid_at:string|null; confirmed_at:string|null; confirmed_by:string|null; created_at:string; updated_at:string }; Insert:any; Update:any; Relationships: [] };
      platform_admins: { Row: { id:string; auth_user_id:string; email:string; active:boolean; created_at:string; updated_at:string }; Insert:any; Update:any; Relationships: [] };
      subscription_audit_logs: { Row: { id:string; business_id:string|null; actor_id:string|null; action:string; details:Record<string, unknown>; created_at:string }; Insert:any; Update:any; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      create_business_with_admin: {
        Args: { p_name: string };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      create_product: {
        Args: {
          p_business_id: string;
          p_name: string;
          p_category_id: string | null;
          p_cost_price: number | null;
          p_selling_price: number;
          p_initial_stock: number;
          p_low_stock_threshold: number;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"];
      };
      adjust_stock: {
        Args: {
          p_product_id: string;
          p_type: "entrada" | "ajuste";
          p_quantity: number;
          p_note: string | null;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"];
      };
      create_sale: {
        Args: {
          p_business_id: string;
          p_payment_method: SalePaymentMethod;
          p_customer_id: string | null;
          p_items: { product_id: string; quantity: number }[];
        };
        Returns: Database["public"]["Tables"]["sales"]["Row"];
      };
      register_debt_payment: {
        Args: {
          p_debt_id: string;
          p_amount: number;
          p_payment_method: DebtPaymentMethod;
        };
        Returns: Database["public"]["Tables"]["debts"]["Row"];
      };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      create_subscription_payment: { Args: { p_plan_id:string; p_billing_cycle:BillingCycle; p_payment_method:"mpesa"|"emola"|"mkesh"|"bank_transfer"|"cash"|"other"; p_transaction_id:string|null; p_notes:string|null }; Returns: Database["public"]["Tables"]["subscription_payments"]["Row"] };
      confirm_subscription_payment: { Args: { p_payment_id:string; p_confirm:boolean; p_notes:string|null }; Returns: Database["public"]["Tables"]["subscription_payments"]["Row"] };
      expire_due_subscriptions: { Args: Record<string, never>; Returns: number };
    };
  };
}
