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
          avatar_path: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_path?: string | null
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
          base_id: string | null
          client_id: string
          id: string
          nome: string
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string | null
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          client_id: string
          id?: string
          nome: string
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          client_id?: string
          id?: string
          nome?: string
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "asset"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "asset_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_category: {
        Row: {
          grupo: Database["public"]["Enums"]["expense_group"]
          id: string
          is_padrao: boolean
          nome: string
          ordem: number
          org_id: string
        }
        Insert: {
          grupo?: Database["public"]["Enums"]["expense_group"]
          id?: string
          is_padrao?: boolean
          nome: string
          ordem?: number
          org_id: string
        }
        Update: {
          grupo?: Database["public"]["Enums"]["expense_group"]
          id?: string
          is_padrao?: boolean
          nome?: string
          ordem?: number
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
      card_statement: {
        Row: {
          cartao: string
          categoria: Database["public"]["Enums"]["card_category"]
          id: string
          org_id: string
          record_id: string
          valor: number
        }
        Insert: {
          cartao: string
          categoria: Database["public"]["Enums"]["card_category"]
          id?: string
          org_id: string
          record_id: string
          valor?: number
        }
        Update: {
          cartao?: string
          categoria?: Database["public"]["Enums"]["card_category"]
          id?: string
          org_id?: string
          record_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_statement_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_statement_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "monthly_record"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          adesao: string | null
          avatar_path: string | null
          created_at: string
          email: string | null
          id: string
          nascimento: string | null
          nome: string
          notas: string | null
          org_id: string
          planner_id: string | null
          plano_status: Database["public"]["Enums"]["plan_status"]
          pontos_total: number
          portal_user_id: string | null
          profissao: string | null
          risco: Database["public"]["Enums"]["risk_profile"] | null
          tem_investimento: boolean
          tem_planejamento: boolean
          tier: Database["public"]["Enums"]["reward_tier"]
        }
        Insert: {
          adesao?: string | null
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nascimento?: string | null
          nome: string
          notas?: string | null
          org_id: string
          planner_id?: string | null
          plano_status?: Database["public"]["Enums"]["plan_status"]
          pontos_total?: number
          portal_user_id?: string | null
          profissao?: string | null
          risco?: Database["public"]["Enums"]["risk_profile"] | null
          tem_investimento?: boolean
          tem_planejamento?: boolean
          tier?: Database["public"]["Enums"]["reward_tier"]
        }
        Update: {
          adesao?: string | null
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nascimento?: string | null
          nome?: string
          notas?: string | null
          org_id?: string
          planner_id?: string | null
          plano_status?: Database["public"]["Enums"]["plan_status"]
          pontos_total?: number
          portal_user_id?: string | null
          profissao?: string | null
          risco?: Database["public"]["Enums"]["risk_profile"] | null
          tem_investimento?: boolean
          tem_planejamento?: boolean
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
          base_id: string | null
          client_id: string
          credor: string | null
          descricao: string
          fim: string | null
          id: string
          inicio: string | null
          ordem: number
          org_id: string
          parcela: number | null
          parcelas_total: number | null
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string | null
          saldo: number | null
          suprimido: boolean
          total: number
        }
        Insert: {
          base_id?: string | null
          client_id: string
          credor?: string | null
          descricao: string
          fim?: string | null
          id?: string
          inicio?: string | null
          ordem?: number
          org_id: string
          parcela?: number | null
          parcelas_total?: number | null
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          saldo?: number | null
          suprimido?: boolean
          total?: number
        }
        Update: {
          base_id?: string | null
          client_id?: string
          credor?: string | null
          descricao?: string
          fim?: string | null
          id?: string
          inicio?: string | null
          ordem?: number
          org_id?: string
          parcela?: number | null
          parcelas_total?: number | null
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          saldo?: number | null
          suprimido?: boolean
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "debt_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "debt"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "debt_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entry: {
        Row: {
          bucket: Database["public"]["Enums"]["budget_bucket"]
          categoria_id: string | null
          descricao: string | null
          fixo: boolean
          id: string
          org_id: string
          record_id: string
          valor: number
        }
        Insert: {
          bucket?: Database["public"]["Enums"]["budget_bucket"]
          categoria_id?: string | null
          descricao?: string | null
          fixo?: boolean
          id?: string
          org_id: string
          record_id: string
          valor?: number
        }
        Update: {
          bucket?: Database["public"]["Enums"]["budget_bucket"]
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
      financial_plan: {
        Row: {
          cadencia: Database["public"]["Enums"]["plan_cadence"]
          client_id: string
          created_at: string
          dia_fatura: number | null
          dia_pagamento: number | null
          dia_referencia: number
          id: string
          idade_limite: number
          inflacao: number
          inicio: string
          juros_aposentadoria: number
          juros_curto: number
          juros_longo: number
          meses_curto: number
          modo_valor: Database["public"]["Enums"]["plan_value_mode"]
          org_id: string
          status: Database["public"]["Enums"]["plan_lifecycle"]
          tipo: Database["public"]["Enums"]["plan_kind"]
          updated_at: string
          versao: number
        }
        Insert: {
          cadencia?: Database["public"]["Enums"]["plan_cadence"]
          client_id: string
          created_at?: string
          dia_fatura?: number | null
          dia_pagamento?: number | null
          dia_referencia?: number
          id?: string
          idade_limite?: number
          inflacao?: number
          inicio: string
          juros_aposentadoria?: number
          juros_curto?: number
          juros_longo?: number
          meses_curto?: number
          modo_valor?: Database["public"]["Enums"]["plan_value_mode"]
          org_id: string
          status?: Database["public"]["Enums"]["plan_lifecycle"]
          tipo?: Database["public"]["Enums"]["plan_kind"]
          updated_at?: string
          versao?: number
        }
        Update: {
          cadencia?: Database["public"]["Enums"]["plan_cadence"]
          client_id?: string
          created_at?: string
          dia_fatura?: number | null
          dia_pagamento?: number | null
          dia_referencia?: number
          id?: string
          idade_limite?: number
          inflacao?: number
          inicio?: string
          juros_aposentadoria?: number
          juros_curto?: number
          juros_longo?: number
          meses_curto?: number
          modo_valor?: Database["public"]["Enums"]["plan_value_mode"]
          org_id?: string
          status?: Database["public"]["Enums"]["plan_lifecycle"]
          tipo?: Database["public"]["Enums"]["plan_kind"]
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_plan_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_plan_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      goal: {
        Row: {
          alvo: number
          atual: number
          base_id: string | null
          client_id: string
          concluido: boolean
          created_at: string
          data_alvo: string | null
          id: string
          ordem: number
          org_id: string
          periodicidade_anos: number | null
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string | null
          prazo: Database["public"]["Enums"]["goal_term"]
          prioridade: number
          suprimido: boolean
          titulo: string
        }
        Insert: {
          alvo?: number
          atual?: number
          base_id?: string | null
          client_id: string
          concluido?: boolean
          created_at?: string
          data_alvo?: string | null
          id?: string
          ordem?: number
          org_id: string
          periodicidade_anos?: number | null
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          prazo?: Database["public"]["Enums"]["goal_term"]
          prioridade?: number
          suprimido?: boolean
          titulo: string
        }
        Update: {
          alvo?: number
          atual?: number
          base_id?: string | null
          client_id?: string
          concluido?: boolean
          created_at?: string
          data_alvo?: string | null
          id?: string
          ordem?: number
          org_id?: string
          periodicidade_anos?: number | null
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          prazo?: Database["public"]["Enums"]["goal_term"]
          prioridade?: number
          suprimido?: boolean
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "goal"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "goal_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batch: {
        Row: {
          arquivo_nome: string | null
          created_at: string
          criado_por: string | null
          data_referencia: string | null
          fonte: Database["public"]["Enums"]["import_source"]
          id: string
          linhas_ok: number | null
          linhas_total: number | null
          org_id: string
        }
        Insert: {
          arquivo_nome?: string | null
          created_at?: string
          criado_por?: string | null
          data_referencia?: string | null
          fonte: Database["public"]["Enums"]["import_source"]
          id?: string
          linhas_ok?: number | null
          linhas_total?: number | null
          org_id: string
        }
        Update: {
          arquivo_nome?: string | null
          created_at?: string
          criado_por?: string | null
          data_referencia?: string | null
          fonte?: Database["public"]["Enums"]["import_source"]
          id?: string
          linhas_ok?: number | null
          linhas_total?: number | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batch_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batch_org_id_fkey"
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
          base_id: string | null
          classe: Database["public"]["Enums"]["investment_class"]
          client_id: string
          id: string
          instituicao: string | null
          liquidez: string | null
          nome: string | null
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string | null
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          classe: Database["public"]["Enums"]["investment_class"]
          client_id: string
          id?: string
          instituicao?: string | null
          liquidez?: string | null
          nome?: string | null
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          classe?: Database["public"]["Enums"]["investment_class"]
          client_id?: string
          id?: string
          instituicao?: string | null
          liquidez?: string | null
          nome?: string | null
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "investment"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "investment_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_account: {
        Row: {
          apelido: string
          ativo: boolean
          client_id: string
          created_at: string
          custodiante: string | null
          id: string
          instituicao: string
          numero: string | null
          ordem: number
          org_id: string
          titular_tipo: Database["public"]["Enums"]["holder_type"]
        }
        Insert: {
          apelido: string
          ativo?: boolean
          client_id: string
          created_at?: string
          custodiante?: string | null
          id?: string
          instituicao: string
          numero?: string | null
          ordem?: number
          org_id: string
          titular_tipo?: Database["public"]["Enums"]["holder_type"]
        }
        Update: {
          apelido?: string
          ativo?: boolean
          client_id?: string
          created_at?: string
          custodiante?: string | null
          id?: string
          instituicao?: string
          numero?: string | null
          ordem?: number
          org_id?: string
          titular_tipo?: Database["public"]["Enums"]["holder_type"]
        }
        Relationships: [
          {
            foreignKeyName: "investment_account_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_account_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_position: {
        Row: {
          account_id: string
          classe: Database["public"]["Enums"]["investment_class"]
          client_id: string
          coberto_fgc: boolean
          created_at: string
          custo: number | null
          data_aplicacao: string | null
          emissor_nome: string | null
          id: string
          indexador: Database["public"]["Enums"]["position_indexer"]
          isento_ir: boolean
          liquidez: string | null
          nome: string
          ordem: number
          org_id: string
          origem: Database["public"]["Enums"]["position_origin"]
          quantidade: number | null
          taxa: number | null
          tipo_instrumento: string | null
          vencimento: string | null
        }
        Insert: {
          account_id: string
          classe: Database["public"]["Enums"]["investment_class"]
          client_id: string
          coberto_fgc?: boolean
          created_at?: string
          custo?: number | null
          data_aplicacao?: string | null
          emissor_nome?: string | null
          id?: string
          indexador?: Database["public"]["Enums"]["position_indexer"]
          isento_ir?: boolean
          liquidez?: string | null
          nome: string
          ordem?: number
          org_id: string
          origem?: Database["public"]["Enums"]["position_origin"]
          quantidade?: number | null
          taxa?: number | null
          tipo_instrumento?: string | null
          vencimento?: string | null
        }
        Update: {
          account_id?: string
          classe?: Database["public"]["Enums"]["investment_class"]
          client_id?: string
          coberto_fgc?: boolean
          created_at?: string
          custo?: number | null
          data_aplicacao?: string | null
          emissor_nome?: string | null
          id?: string
          indexador?: Database["public"]["Enums"]["position_indexer"]
          isento_ir?: boolean
          liquidez?: string | null
          nome?: string
          ordem?: number
          org_id?: string
          origem?: Database["public"]["Enums"]["position_origin"]
          quantidade?: number | null
          taxa?: number | null
          tipo_instrumento?: string | null
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_position_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_position_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_position_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      liability: {
        Row: {
          base_id: string | null
          client_id: string
          id: string
          nome: string
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string | null
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          client_id: string
          id?: string
          nome: string
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          client_id?: string
          id?: string
          nome?: string
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string | null
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "liability_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "liability"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "liability_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
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
          quando: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          gcal_event_id?: string | null
          id?: string
          notas?: string | null
          org_id: string
          quando: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          gcal_event_id?: string | null
          id?: string
          notas?: string | null
          org_id?: string
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
        ]
      }
      meeting_participante: {
        Row: {
          app_user_id: string | null
          client_id: string | null
          id: string
          meeting_id: string
          org_id: string
        }
        Insert: {
          app_user_id?: string | null
          client_id?: string | null
          id?: string
          meeting_id: string
          org_id: string
        }
        Update: {
          app_user_id?: string | null
          client_id?: string | null
          id?: string
          meeting_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participante_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participante_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participante_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participante_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_record: {
        Row: {
          client_id: string
          created_at: string
          fechado_em: string | null
          id: string
          observacao: string | null
          org_id: string
          plan_id: string | null
          ref_mes: string
          sobras_calc: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          fechado_em?: string | null
          id?: string
          observacao?: string | null
          org_id: string
          plan_id?: string | null
          ref_mes: string
          sobras_calc?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          fechado_em?: string | null
          id?: string
          observacao?: string | null
          org_id?: string
          plan_id?: string | null
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
          {
            foreignKeyName: "monthly_record_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
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
      plan_card_purchase: {
        Row: {
          base_id: string | null
          cartao: string
          created_at: string
          descricao: string
          id: string
          inicio: string
          ordem: number
          org_id: string
          parcelas: number
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
          valor_parcela: number
        }
        Insert: {
          base_id?: string | null
          cartao: string
          created_at?: string
          descricao: string
          id?: string
          inicio: string
          ordem?: number
          org_id: string
          parcelas?: number
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
          valor_parcela?: number
        }
        Update: {
          base_id?: string | null
          cartao?: string
          created_at?: string
          descricao?: string
          id?: string
          inicio?: string
          ordem?: number
          org_id?: string
          parcelas?: number
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_card_purchase_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_card_purchase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_card_purchase_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_card_purchase_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_change: {
        Row: {
          base_id: string | null
          categoria: Database["public"]["Enums"]["change_category"]
          created_at: string
          fim: string | null
          horizonte: Database["public"]["Enums"]["plan_horizon"]
          id: string
          inicio: string
          observacao: string | null
          ordem: number
          org_id: string
          parcelas: number | null
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
          titulo: string
          valor: number
        }
        Insert: {
          base_id?: string | null
          categoria: Database["public"]["Enums"]["change_category"]
          created_at?: string
          fim?: string | null
          horizonte?: Database["public"]["Enums"]["plan_horizon"]
          id?: string
          inicio: string
          observacao?: string | null
          ordem?: number
          org_id: string
          parcelas?: number | null
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
          titulo: string
          valor?: number
        }
        Update: {
          base_id?: string | null
          categoria?: Database["public"]["Enums"]["change_category"]
          created_at?: string
          fim?: string | null
          horizonte?: Database["public"]["Enums"]["plan_horizon"]
          id?: string
          inicio?: string
          observacao?: string | null
          ordem?: number
          org_id?: string
          parcelas?: number | null
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
          titulo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_change_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_change"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_change_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_change_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_expense: {
        Row: {
          base_id: string | null
          bucket: Database["public"]["Enums"]["budget_bucket"]
          categoria_plan_id: string
          descricao: string | null
          frequencia: Database["public"]["Enums"]["entry_frequency"]
          id: string
          mes_ocorrencia: number | null
          meses: number[] | null
          ordem: number
          org_id: string
          pagamento: Database["public"]["Enums"]["payment_method"]
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          bucket?: Database["public"]["Enums"]["budget_bucket"]
          categoria_plan_id: string
          descricao?: string | null
          frequencia?: Database["public"]["Enums"]["entry_frequency"]
          id?: string
          mes_ocorrencia?: number | null
          meses?: number[] | null
          ordem?: number
          org_id: string
          pagamento?: Database["public"]["Enums"]["payment_method"]
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          bucket?: Database["public"]["Enums"]["budget_bucket"]
          categoria_plan_id?: string
          descricao?: string | null
          frequencia?: Database["public"]["Enums"]["entry_frequency"]
          id?: string
          mes_ocorrencia?: number | null
          meses?: number[] | null
          ordem?: number
          org_id?: string
          pagamento?: Database["public"]["Enums"]["payment_method"]
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_expense_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_expense"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_expense_categoria_plan_id_fkey"
            columns: ["categoria_plan_id"]
            isOneToOne: false
            referencedRelation: "plan_expense_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_expense_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_expense_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_expense_category: {
        Row: {
          base_id: string | null
          created_at: string
          id: string
          nome: string
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
        }
        Insert: {
          base_id?: string | null
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
        }
        Update: {
          base_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "plan_expense_category_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_expense_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_expense_category_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_expense_category_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_income: {
        Row: {
          base_id: string | null
          derivado: Database["public"]["Enums"]["derived_income"] | null
          fonte: string
          frequencia: Database["public"]["Enums"]["entry_frequency"]
          id: string
          mes_ocorrencia: number | null
          meses: number[] | null
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          derivado?: Database["public"]["Enums"]["derived_income"] | null
          fonte: string
          frequencia?: Database["public"]["Enums"]["entry_frequency"]
          id?: string
          mes_ocorrencia?: number | null
          meses?: number[] | null
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          derivado?: Database["public"]["Enums"]["derived_income"] | null
          fonte?: string
          frequencia?: Database["public"]["Enums"]["entry_frequency"]
          id?: string
          mes_ocorrencia?: number | null
          meses?: number[] | null
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_income_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_income"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_income_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_income_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_insurance: {
        Row: {
          base_id: string | null
          id: string
          nome: string
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          id?: string
          nome: string
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_insurance_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_insurance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_insurance_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_insurance_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pension: {
        Row: {
          base_id: string | null
          id: string
          nome: string
          ordem: number
          org_id: string
          persistencia: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido: boolean
          valor: number
        }
        Insert: {
          base_id?: string | null
          id?: string
          nome: string
          ordem?: number
          org_id: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id: string
          suprimido?: boolean
          valor?: number
        }
        Update: {
          base_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          org_id?: string
          persistencia?: Database["public"]["Enums"]["row_persistence"]
          plan_id?: string
          suprimido?: boolean
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_pension_base_id_fkey"
            columns: ["base_id"]
            isOneToOne: false
            referencedRelation: "plan_pension"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_pension_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_pension_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
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
      position_snapshot: {
        Row: {
          created_at: string
          data_referencia: string
          id: string
          import_batch_id: string | null
          org_id: string
          position_id: string
          valor_bruto: number
        }
        Insert: {
          created_at?: string
          data_referencia: string
          id?: string
          import_batch_id?: string | null
          org_id: string
          position_id: string
          valor_bruto?: number
        }
        Update: {
          created_at?: string
          data_referencia?: string
          id?: string
          import_batch_id?: string | null
          org_id?: string
          position_id?: string
          valor_bruto?: number
        }
        Relationships: [
          {
            foreignKeyName: "position_snapshot_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_snapshot_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_snapshot_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "investment_position"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_snapshot_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "position_latest"
            referencedColumns: ["position_id"]
          },
        ]
      }
      projection: {
        Row: {
          client_id: string
          congelada: boolean
          gerado_em: string
          horizonte: Database["public"]["Enums"]["projection_horizon"]
          id: string
          org_id: string
          plan_id: string | null
          premissas_hash: string | null
          rotulo: string | null
          serie: Json | null
        }
        Insert: {
          client_id: string
          congelada?: boolean
          gerado_em?: string
          horizonte: Database["public"]["Enums"]["projection_horizon"]
          id?: string
          org_id: string
          plan_id?: string | null
          premissas_hash?: string | null
          rotulo?: string | null
          serie?: Json | null
        }
        Update: {
          client_id?: string
          congelada?: boolean
          gerado_em?: string
          horizonte?: Database["public"]["Enums"]["projection_horizon"]
          id?: string
          org_id?: string
          plan_id?: string | null
          premissas_hash?: string | null
          rotulo?: string | null
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
          {
            foreignKeyName: "projection_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
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
          placar: Json | null
          plan_id: string | null
          ref_mes: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          org_id: string
          pdf_url?: string | null
          periodo: string
          placar?: Json | null
          plan_id?: string | null
          ref_mes?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          org_id?: string
          pdf_url?: string | null
          periodo?: string
          placar?: Json | null
          plan_id?: string | null
          ref_mes?: string | null
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
          {
            foreignKeyName: "report_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      report_directive: {
        Row: {
          created_at: string
          id: string
          ordem: number
          org_id: string
          report_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          org_id: string
          report_id: string
          texto: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          org_id?: string
          report_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_directive_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_directive_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "report"
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
          plan_id: string | null
          renda_desejada: number | null
          renda_inss: number
        }
        Insert: {
          client_id: string
          id?: string
          idade_alvo?: number | null
          idade_atual?: number | null
          org_id: string
          plan_id?: string | null
          renda_desejada?: number | null
          renda_inss?: number
        }
        Update: {
          client_id?: string
          id?: string
          idade_alvo?: number | null
          idade_atual?: number | null
          org_id?: string
          plan_id?: string | null
          renda_desejada?: number | null
          renda_inss?: number
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
          {
            foreignKeyName: "retirement_plan_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_plan"
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
      signup_invite: {
        Row: {
          convidado_por: string | null
          created_at: string
          email: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          usado_em: string | null
          usado_por: string | null
        }
        Insert: {
          convidado_por?: string | null
          created_at?: string
          email: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
          usado_em?: string | null
          usado_por?: string | null
        }
        Update: {
          convidado_por?: string | null
          created_at?: string
          email?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          usado_em?: string | null
          usado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signup_invite_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signup_invite_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
      position_latest: {
        Row: {
          account_id: string | null
          client_id: string | null
          data_referencia: string | null
          position_id: string | null
          valor_bruto: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_position_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_position_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_write: { Args: never; Returns: boolean }
      current_org_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_staff: { Args: never; Returns: boolean }
      update_own_avatar: {
        Args: { p_path: string }
        Returns: {
          avatar_path: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        SetofOptions: {
          from: "*"
          to: "app_user"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_own_profile: {
        Args: { p_nome: string }
        Returns: {
          avatar_path: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        SetofOptions: {
          from: "*"
          to: "app_user"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      budget_bucket: "fixo" | "extra" | "parcela" | "adicional"
      card_category:
        | "alimentacao"
        | "transporte"
        | "compras"
        | "saude"
        | "vestuario"
        | "lazer"
        | "outros"
      change_category: "receita" | "despesa" | "divida"
      derived_income: "decimo_terceiro" | "ferias"
      entry_frequency: "mensal" | "anual" | "meses"
      expense_group:
        | "casa"
        | "saude"
        | "transporte"
        | "lazer"
        | "filhos_pets"
        | "outros"
      goal_term: "curto" | "longo"
      holder_type: "pf" | "pj"
      import_source:
        | "manual"
        | "eleva_csv"
        | "xp_csv"
        | "btg_csv"
        | "open_finance"
        | "api"
      investment_class: "renda_fixa" | "renda_variavel" | "previdencia"
      payment_method: "credito" | "debito"
      plan_cadence: "mensal" | "bimestral" | "trimestral"
      plan_horizon: "curto" | "longo"
      plan_kind: "pre_hfc" | "hfc" | "real"
      plan_lifecycle: "rascunho" | "ativo" | "arquivado"
      plan_status: "ativo" | "diagnostico" | "pendente"
      plan_value_mode: "nominal" | "real"
      point_event_type: "meta" | "indicacao" | "engajamento" | "ajuste"
      position_indexer: "cdi" | "ipca" | "prefixado" | "selic" | "nao_aplica"
      position_origin: "manual" | "importado"
      projection_horizon: "curta" | "longa" | "aposentadoria"
      redemption_status: "solicitado" | "entregue" | "cancelado"
      referral_status: "pendente" | "convertido" | "cancelado"
      report_metric: "receitas" | "despesas" | "sobras" | "investimentos"
      report_status: "rascunho" | "publicado"
      reward_tier: "bronze" | "prata" | "ouro"
      risk_profile: "conservador" | "moderado" | "arrojado"
      row_persistence: "herdado" | "mes" | "permanente"
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
      budget_bucket: ["fixo", "extra", "parcela", "adicional"],
      card_category: [
        "alimentacao",
        "transporte",
        "compras",
        "saude",
        "vestuario",
        "lazer",
        "outros",
      ],
      change_category: ["receita", "despesa", "divida"],
      derived_income: ["decimo_terceiro", "ferias"],
      entry_frequency: ["mensal", "anual", "meses"],
      expense_group: [
        "casa",
        "saude",
        "transporte",
        "lazer",
        "filhos_pets",
        "outros",
      ],
      goal_term: ["curto", "longo"],
      holder_type: ["pf", "pj"],
      import_source: [
        "manual",
        "eleva_csv",
        "xp_csv",
        "btg_csv",
        "open_finance",
        "api",
      ],
      investment_class: ["renda_fixa", "renda_variavel", "previdencia"],
      payment_method: ["credito", "debito"],
      plan_cadence: ["mensal", "bimestral", "trimestral"],
      plan_horizon: ["curto", "longo"],
      plan_kind: ["pre_hfc", "hfc", "real"],
      plan_lifecycle: ["rascunho", "ativo", "arquivado"],
      plan_status: ["ativo", "diagnostico", "pendente"],
      plan_value_mode: ["nominal", "real"],
      point_event_type: ["meta", "indicacao", "engajamento", "ajuste"],
      position_indexer: ["cdi", "ipca", "prefixado", "selic", "nao_aplica"],
      position_origin: ["manual", "importado"],
      projection_horizon: ["curta", "longa", "aposentadoria"],
      redemption_status: ["solicitado", "entregue", "cancelado"],
      referral_status: ["pendente", "convertido", "cancelado"],
      report_metric: ["receitas", "despesas", "sobras", "investimentos"],
      report_status: ["rascunho", "publicado"],
      reward_tier: ["bronze", "prata", "ouro"],
      risk_profile: ["conservador", "moderado", "arrojado"],
      row_persistence: ["herdado", "mes", "permanente"],
      user_role: ["admin", "planner", "assistant", "client"],
    },
  },
} as const
