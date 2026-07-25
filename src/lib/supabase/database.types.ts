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
      app_user: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "app_user_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      asset: {
        Row: {
          client_id: string
          id: string
          nome: string
          org_id: string
          valor: number
        }
        Insert: {
          client_id: string
          id?: string
          nome: string
          org_id: string
          valor?: number
        }
        Update: {
          client_id?: string
          id?: string
          nome?: string
          org_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_category: {
        Row: {
          grupo: Database["public"]["Enums"]["budget_group"]
          id: string
          nome: string
          org_id: string
        }
        Insert: {
          grupo?: Database["public"]["Enums"]["budget_group"]
          id?: string
          nome: string
          org_id: string
        }
        Update: {
          grupo?: Database["public"]["Enums"]["budget_group"]
          id?: string
          nome?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_category_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_target: {
        Row: {
          categoria_id: string
          client_id: string
          id: string
          ideal: number
          org_id: string
        }
        Insert: {
          categoria_id: string
          client_id: string
          id?: string
          ideal?: number
          org_id: string
        }
        Update: {
          categoria_id?: string
          client_id?: string
          id?: string
          ideal?: number
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_target_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "budget_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_target_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_target_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nascimento: string | null
          nome: string
          org_id: string
          planner_id: string | null
          plano_status: Database["public"]["Enums"]["plan_status"]
          pontos_total: number
          portal_user_id: string | null
          profissao: string | null
          risco: Database["public"]["Enums"]["risk_profile"] | null
          tier: Database["public"]["Enums"]["reward_tier"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nascimento?: string | null
          nome: string
          org_id: string
          planner_id?: string | null
          plano_status?: Database["public"]["Enums"]["plan_status"]
          pontos_total?: number
          portal_user_id?: string | null
          profissao?: string | null
          risco?: Database["public"]["Enums"]["risk_profile"] | null
          tier?: Database["public"]["Enums"]["reward_tier"]
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nascimento?: string | null
          nome?: string
          org_id?: string
          planner_id?: string | null
          plano_status?: Database["public"]["Enums"]["plan_status"]
          pontos_total?: number
          portal_user_id?: string | null
          profissao?: string | null
          risco?: Database["public"]["Enums"]["risk_profile"] | null
          tier?: Database["public"]["Enums"]["reward_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "client_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_planner_id_fkey"
            columns: ["planner_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      debt: {
        Row: {
          client_id: string
          descricao: string
          id: string
          org_id: string
          parcela: number | null
          total: number
        }
        Insert: {
          client_id: string
          descricao: string
          id?: string
          org_id: string
          parcela?: number | null
          total?: number
        }
        Update: {
          client_id?: string
          descricao?: string
          id?: string
          org_id?: string
          parcela?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entry: {
        Row: {
          categoria_id: string | null
          descricao: string | null
          fixo: boolean
          id: string
          org_id: string
          record_id: string
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          descricao?: string | null
          fixo?: boolean
          id?: string
          org_id: string
          record_id: string
          valor?: number
        }
        Update: {
          categoria_id?: string | null
          descricao?: string | null
          fixo?: boolean
          id?: string
          org_id?: string
          record_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_entry_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "budget_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entry_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entry_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "monthly_record"
            referencedColumns: ["id"]
          },
        ]
      }
      goal: {
        Row: {
          alvo: number
          atual: number
          client_id: string
          created_at: string
          id: string
          org_id: string
          prazo: Database["public"]["Enums"]["goal_term"]
          prioridade: number
          titulo: string
        }
        Insert: {
          alvo?: number
          atual?: number
          client_id: string
          created_at?: string
          id?: string
          org_id: string
          prazo?: Database["public"]["Enums"]["goal_term"]
          prioridade?: number
          titulo: string
        }
        Update: {
          alvo?: number
          atual?: number
          client_id?: string
          created_at?: string
          id?: string
          org_id?: string
          prazo?: Database["public"]["Enums"]["goal_term"]
          prioridade?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      income_entry: {
        Row: {
          fonte: string
          id: string
          org_id: string
          record_id: string
          valor: number
        }
        Insert: {
          fonte: string
          id?: string
          org_id: string
          record_id: string
          valor?: number
        }
        Update: {
          fonte?: string
          id?: string
          org_id?: string
          record_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "income_entry_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entry_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "monthly_record"
            referencedColumns: ["id"]
          },
        ]
      }
      investment: {
        Row: {
          classe: Database["public"]["Enums"]["investment_class"]
          client_id: string
          id: string
          org_id: string
          valor: number
        }
        Insert: {
          classe: Database["public"]["Enums"]["investment_class"]
          client_id: string
          id?: string
          org_id: string
          valor?: number
        }
        Update: {
          classe?: Database["public"]["Enums"]["investment_class"]
          client_id?: string
          id?: string
          org_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      liability: {
        Row: {
          client_id: string
          id: string
          nome: string
          org_id: string
          valor: number
        }
        Insert: {
          client_id: string
          id?: string
          nome: string
          org_id: string
          valor?: number
        }
        Update: {
          client_id?: string
          id?: string
          nome?: string
          org_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "liability_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liability_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting: {
        Row: {
          client_id: string | null
          created_at: string
          gcal_event_id: string | null
          id: string
          notas: string | null
          org_id: string
          planner_id: string | null
          quando: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          gcal_event_id?: string | null
          id?: string
          notas?: string | null
          org_id: string
          planner_id?: string | null
          quando: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          gcal_event_id?: string | null
          id?: string
          notas?: string | null
          org_id?: string
          planner_id?: string | null
          quando?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_planner_id_fkey"
            columns: ["planner_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_record: {
        Row: {
          client_id: string
          created_at: string
          id: string
          org_id: string
          ref_mes: string
          sobras_calc: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          org_id: string
          ref_mes: string
          sobras_calc?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          org_id?: string
          ref_mes?: string
          sobras_calc?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_record_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_record_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          created_at: string
          id: string
          name: string
          plano: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plano?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plano?: string | null
        }
        Relationships: []
      }
      point_event: {
        Row: {
          client_id: string
          data: string
          id: string
          org_id: string
          pontos: number
          ref_id: string | null
          tipo: Database["public"]["Enums"]["point_event_type"]
        }
        Insert: {
          client_id: string
          data?: string
          id?: string
          org_id: string
          pontos?: number
          ref_id?: string | null
          tipo: Database["public"]["Enums"]["point_event_type"]
        }
        Update: {
          client_id?: string
          data?: string
          id?: string
          org_id?: string
          pontos?: number
          ref_id?: string | null
          tipo?: Database["public"]["Enums"]["point_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "point_event_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_event_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      projection: {
        Row: {
          client_id: string
          horizonte: Database["public"]["Enums"]["projection_horizon"]
          id: string
          org_id: string
          serie: Json | null
        }
        Insert: {
          client_id: string
          horizonte: Database["public"]["Enums"]["projection_horizon"]
          id?: string
          org_id: string
          serie?: Json | null
        }
        Update: {
          client_id?: string
          horizonte?: Database["public"]["Enums"]["projection_horizon"]
          id?: string
          org_id?: string
          serie?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projection_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projection_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      referral: {
        Row: {
          client_id: string
          id: string
          indicado_email: string | null
          indicado_nome: string
          org_id: string
          pontos_premio: number
          status: Database["public"]["Enums"]["referral_status"]
        }
        Insert: {
          client_id: string
          id?: string
          indicado_email?: string | null
          indicado_nome: string
          org_id: string
          pontos_premio?: number
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Update: {
          client_id?: string
          id?: string
          indicado_email?: string | null
          indicado_nome?: string
          org_id?: string
          pontos_premio?: number
          status?: Database["public"]["Enums"]["referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "referral_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      rendafixa_link: {
        Row: {
          external_id: string | null
          id: string
          investment_id: string
          org_id: string
          synced_at: string | null
        }
        Insert: {
          external_id?: string | null
          id?: string
          investment_id: string
          org_id: string
          synced_at?: string | null
        }
        Update: {
          external_id?: string | null
          id?: string
          investment_id?: string
          org_id?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rendafixa_link_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: true
            referencedRelation: "investment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendafixa_link_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      report: {
        Row: {
          client_id: string
          created_at: string
          id: string
          org_id: string
          pdf_url: string | null
          periodo: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          org_id: string
          pdf_url?: string | null
          periodo: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          org_id?: string
          pdf_url?: string | null
          periodo?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "report_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      retirement_plan: {
        Row: {
          client_id: string
          id: string
          idade_alvo: number | null
          idade_atual: number | null
          org_id: string
          renda_desejada: number | null
        }
        Insert: {
          client_id: string
          id?: string
          idade_alvo?: number | null
          idade_atual?: number | null
          org_id: string
          renda_desejada?: number | null
        }
        Update: {
          client_id?: string
          id?: string
          idade_alvo?: number | null
          idade_atual?: number | null
          org_id?: string
          renda_desejada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retirement_plan_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retirement_plan_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      reward: {
        Row: {
          ativo: boolean
          custo_pontos: number
          id: string
          nome: string
          org_id: string
          tier_min: Database["public"]["Enums"]["reward_tier"]
        }
        Insert: {
          ativo?: boolean
          custo_pontos?: number
          id?: string
          nome: string
          org_id: string
          tier_min?: Database["public"]["Enums"]["reward_tier"]
        }
        Update: {
          ativo?: boolean
          custo_pontos?: number
          id?: string
          nome?: string
          org_id?: string
          tier_min?: Database["public"]["Enums"]["reward_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "reward_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemption: {
        Row: {
          client_id: string
          data: string
          id: string
          org_id: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
        }
        Insert: {
          client_id: string
          data?: string
          id?: string
          org_id: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Update: {
          client_id?: string
          data?: string
          id?: string
          org_id?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemption_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemption_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemption_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_event: {
        Row: {
          client_id: string
          data: string
          id: string
          org_id: string
          titulo: string
        }
        Insert: {
          client_id: string
          data: string
          id?: string
          org_id: string
          titulo: string
        }
        Update: {
          client_id?: string
          data?: string
          id?: string
          org_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write: { Args: never; Returns: boolean }
      current_org_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      budget_group: "fixo" | "pessoal" | "consultorio"
      goal_term: "curto" | "longo"
      investment_class: "renda_fixa" | "renda_variavel" | "previdencia"
      plan_status: "ativo" | "diagnostico" | "pendente"
      point_event_type: "meta" | "indicacao" | "engajamento" | "ajuste"
      projection_horizon: "curta" | "longa"
      redemption_status: "solicitado" | "entregue" | "cancelado"
      referral_status: "pendente" | "convertido" | "cancelado"
      report_status: "rascunho" | "publicado"
      reward_tier: "bronze" | "prata" | "ouro"
      risk_profile: "conservador" | "moderado" | "arrojado"
      user_role: "admin" | "planner" | "assistant" | "client"
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
      budget_group: ["fixo", "pessoal", "consultorio"],
      goal_term: ["curto", "longo"],
      investment_class: ["renda_fixa", "renda_variavel", "previdencia"],
      plan_status: ["ativo", "diagnostico", "pendente"],
      point_event_type: ["meta", "indicacao", "engajamento", "ajuste"],
      projection_horizon: ["curta", "longa"],
      redemption_status: ["solicitado", "entregue", "cancelado"],
      referral_status: ["pendente", "convertido", "cancelado"],
      report_status: ["rascunho", "publicado"],
      reward_tier: ["bronze", "prata", "ouro"],
      risk_profile: ["conservador", "moderado", "arrojado"],
      user_role: ["admin", "planner", "assistant", "client"],
    },
  },
} as const
