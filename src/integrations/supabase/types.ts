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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      acceptance_criteria: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          due_time: string | null
          id: string
          schedule_activity_id: string | null
          sort_order: number
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          schedule_activity_id?: string | null
          sort_order?: number
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          schedule_activity_id?: string | null
          sort_order?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceptance_criteria_schedule_activity_id_fkey"
            columns: ["schedule_activity_id"]
            isOneToOne: false
            referencedRelation: "schedule_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acceptance_criteria_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "backlog_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_tasks: {
        Row: {
          assignee_id: string | null
          category: string
          completion_percentage: number | null
          created_at: string
          description: string
          due_date: string | null
          due_end_time: string | null
          due_time: string | null
          epic_id: string | null
          external_id: string | null
          external_status: string | null
          external_url: string | null
          id: string
          initiative_id: string | null
          key_result_id: string | null
          kr_impact: number | null
          objective_id: string | null
          priority: string
          product_id: string | null
          returned_from_sprint_id: string | null
          roadmap_impact: number | null
          schedule_activity_id: string | null
          sort_order: number | null
          sprint_id: string | null
          status: string
          story_points: number | null
          sync_provider: string | null
          title: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          category?: string
          completion_percentage?: number | null
          created_at?: string
          description?: string
          due_date?: string | null
          due_end_time?: string | null
          due_time?: string | null
          epic_id?: string | null
          external_id?: string | null
          external_status?: string | null
          external_url?: string | null
          id?: string
          initiative_id?: string | null
          key_result_id?: string | null
          kr_impact?: number | null
          objective_id?: string | null
          priority?: string
          product_id?: string | null
          returned_from_sprint_id?: string | null
          roadmap_impact?: number | null
          schedule_activity_id?: string | null
          sort_order?: number | null
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          sync_provider?: string | null
          title: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          category?: string
          completion_percentage?: number | null
          created_at?: string
          description?: string
          due_date?: string | null
          due_end_time?: string | null
          due_time?: string | null
          epic_id?: string | null
          external_id?: string | null
          external_status?: string | null
          external_url?: string | null
          id?: string
          initiative_id?: string | null
          key_result_id?: string | null
          kr_impact?: number | null
          objective_id?: string | null
          priority?: string
          product_id?: string | null
          returned_from_sprint_id?: string | null
          roadmap_impact?: number | null
          schedule_activity_id?: string | null
          sort_order?: number | null
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          sync_provider?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_tasks_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_tasks_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_tasks_returned_from_sprint_id_fkey"
            columns: ["returned_from_sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_tasks_schedule_activity_id_fkey"
            columns: ["schedule_activity_id"]
            isOneToOne: false
            referencedRelation: "schedule_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_analysis: {
        Row: {
          competitor_name: string
          competitor_type: string
          created_at: string | null
          differentiators: string[] | null
          id: string
          notes: string | null
          price_model: string | null
          product_id: string
          strengths: string[] | null
          target_audience: string | null
          threat_level: string | null
          updated_at: string | null
          user_id: string
          value_proposition: string | null
          weaknesses: string[] | null
          website_url: string | null
        }
        Insert: {
          competitor_name: string
          competitor_type: string
          created_at?: string | null
          differentiators?: string[] | null
          id?: string
          notes?: string | null
          price_model?: string | null
          product_id: string
          strengths?: string[] | null
          target_audience?: string | null
          threat_level?: string | null
          updated_at?: string | null
          user_id: string
          value_proposition?: string | null
          weaknesses?: string[] | null
          website_url?: string | null
        }
        Update: {
          competitor_name?: string
          competitor_type?: string
          created_at?: string | null
          differentiators?: string[] | null
          id?: string
          notes?: string | null
          price_model?: string | null
          product_id?: string
          strengths?: string[] | null
          target_audience?: string | null
          threat_level?: string | null
          updated_at?: string | null
          user_id?: string
          value_proposition?: string | null
          weaknesses?: string[] | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_criteria: {
        Row: {
          created_at: string | null
          id: string
          name: string
          product_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          product_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          product_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_criteria_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_scores: {
        Row: {
          competitor_id: string
          criteria_id: string
          id: string
          score: number | null
        }
        Insert: {
          competitor_id: string
          criteria_id: string
          id?: string
          score?: number | null
        }
        Update: {
          competitor_id?: string
          criteria_id?: string
          id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_scores_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitive_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "competitive_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      csd_matrix: {
        Row: {
          category: string
          created_at: string | null
          hypothesis_id: string | null
          id: string
          impact_level: string | null
          notes: string | null
          position: number | null
          product_id: string
          statement: string
          status: string | null
          updated_at: string | null
          user_id: string
          validation_method: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          hypothesis_id?: string | null
          id?: string
          impact_level?: string | null
          notes?: string | null
          position?: number | null
          product_id: string
          statement: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          validation_method?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          hypothesis_id?: string | null
          id?: string
          impact_level?: string | null
          notes?: string | null
          position?: number | null
          product_id?: string
          statement?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          validation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csd_matrix_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "hypotheses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csd_matrix_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      data_analysis: {
        Row: {
          analysis_type: string | null
          conclusions: string | null
          created_at: string | null
          findings: string[] | null
          id: string
          key_metrics: Json | null
          link: string | null
          period_end: string | null
          period_start: string | null
          product_id: string
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          analysis_type?: string | null
          conclusions?: string | null
          created_at?: string | null
          findings?: string[] | null
          id?: string
          key_metrics?: Json | null
          link?: string | null
          period_end?: string | null
          period_start?: string | null
          product_id: string
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          analysis_type?: string | null
          conclusions?: string | null
          created_at?: string | null
          findings?: string[] | null
          id?: string
          key_metrics?: Json | null
          link?: string | null
          period_end?: string | null
          period_start?: string | null
          product_id?: string
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_analysis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      desk_research: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          key_insights: string[] | null
          notes: string | null
          product_id: string
          published_date: string | null
          relevance: string | null
          source: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          key_insights?: string[] | null
          notes?: string | null
          product_id: string
          published_date?: string | null
          relevance?: string | null
          source?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          key_insights?: string[] | null
          notes?: string | null
          product_id?: string
          published_date?: string | null
          relevance?: string | null
          source?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desk_research_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      epics: {
        Row: {
          color: string
          created_at: string
          description: string
          id: string
          name: string
          product_id: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          product_id: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          page: string | null
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          page?: string | null
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          page?: string | null
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hypotheses: {
        Row: {
          assumption: string | null
          confidence: number | null
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          statement: string
          status: string | null
          user_id: string
          validation_method: string | null
        }
        Insert: {
          assumption?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          statement: string
          status?: string | null
          user_id: string
          validation_method?: string | null
        }
        Update: {
          assumption?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          statement?: string
          status?: string | null
          user_id?: string
          validation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hypotheses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_tokens: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          project_key: string | null
          provider: string
          token_encrypted: string
          updated_at: string | null
          user_id: string
          workspace_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          project_key?: string | null
          provider: string
          token_encrypted: string
          updated_at?: string | null
          user_id: string
          workspace_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          project_key?: string | null
          provider?: string
          token_encrypted?: string
          updated_at?: string | null
          user_id?: string
          workspace_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_tokens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          analytics_config: Json | null
          analytics_metric: string | null
          analytics_provider: string | null
          auto_update: boolean | null
          created_at: string
          current_value: number
          id: string
          objective_id: string
          product_id: string | null
          target_value: number
          title: string
          unit: string
          user_id: string
        }
        Insert: {
          analytics_config?: Json | null
          analytics_metric?: string | null
          analytics_provider?: string | null
          auto_update?: boolean | null
          created_at?: string
          current_value?: number
          id?: string
          objective_id: string
          product_id?: string | null
          target_value?: number
          title: string
          unit?: string
          user_id: string
        }
        Update: {
          analytics_config?: Json | null
          analytics_metric?: string | null
          analytics_provider?: string | null
          auto_update?: boolean | null
          created_at?: string
          current_value?: number
          id?: string
          objective_id?: string
          product_id?: string | null
          target_value?: number
          title?: string
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      objectives: {
        Row: {
          category: string
          created_at: string
          id: string
          product_id: string | null
          quarter: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          product_id?: string | null
          quarter: string
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          product_id?: string | null
          quarter?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_templates: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          objectives: Json
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          objectives?: Json
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          objectives?: Json
        }
        Relationships: []
      }
      opportunity_nodes: {
        Row: {
          created_at: string
          description: string
          id: string
          objective_id: string
          parent_id: string | null
          product_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          objective_id: string
          parent_id?: string | null
          product_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          objective_id?: string
          parent_id?: string | null
          product_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_nodes_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "opportunity_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_nodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          age_range: string | null
          avatar_emoji: string | null
          behaviors: string[] | null
          bio: string | null
          created_at: string | null
          frustrations: string[] | null
          goals: string[] | null
          id: string
          name: string
          product_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          age_range?: string | null
          avatar_emoji?: string | null
          behaviors?: string[] | null
          bio?: string | null
          created_at?: string | null
          frustrations?: string[] | null
          goals?: string[] | null
          id?: string
          name: string
          product_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          age_range?: string | null
          avatar_emoji?: string | null
          behaviors?: string[] | null
          bio?: string | null
          created_at?: string | null
          frustrations?: string[] | null
          goals?: string[] | null
          id?: string
          name?: string
          product_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      prds: {
        Row: {
          created_at: string
          estimated_timeline: string
          functional_requirements: Json
          id: string
          non_functional_requirements: Json
          objective: string
          out_of_scope: string
          problem: string
          product_id: string | null
          status: string
          success_metrics: Json
          target_audience: string
          title: string
          updated_at: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          estimated_timeline?: string
          functional_requirements?: Json
          id?: string
          non_functional_requirements?: Json
          objective?: string
          out_of_scope?: string
          problem?: string
          product_id?: string | null
          status?: string
          success_metrics?: Json
          target_audience?: string
          title?: string
          updated_at?: string
          user_id: string
          version?: string
        }
        Update: {
          created_at?: string
          estimated_timeline?: string
          functional_requirements?: Json
          id?: string
          non_functional_requirements?: Json
          objective?: string
          out_of_scope?: string
          problem?: string
          product_id?: string | null
          status?: string
          success_metrics?: Json
          target_audience?: string
          title?: string
          updated_at?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "prds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          product_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          product_id: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          product_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_invites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_members: {
        Row: {
          created_at: string
          id: string
          product_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_problem_statements: {
        Row: {
          created_at: string | null
          id: string
          is_current: boolean | null
          objective: string
          problem: string
          product_id: string
          target_audience: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          objective: string
          problem: string
          product_id: string
          target_audience?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          objective?: string
          problem?: string
          product_id?: string
          target_audience?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_problem_statements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          color: string
          created_at: string
          current_problem_statement_id: string | null
          description: string
          emoji: string
          id: string
          is_public: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          public_token: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          current_problem_statement_id?: string | null
          description?: string
          emoji?: string
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          public_token?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          current_problem_statement_id?: string | null
          description?: string
          emoji?: string
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          public_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_current_problem_statement_id_fkey"
            columns: ["current_problem_statement_id"]
            isOneToOne: false
            referencedRelation: "product_problem_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          company_size: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          how_found: string | null
          id: string
          is_active: boolean
          is_admin: boolean | null
          job_title: string | null
          last_seen_at: string | null
          main_goal: string[] | null
          onboarding_completed: boolean
          pm_experience: string | null
          sector: string | null
          survey_completed: boolean | null
          survey_completed_at: string | null
          terms_accepted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_size?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          how_found?: string | null
          id: string
          is_active?: boolean
          is_admin?: boolean | null
          job_title?: string | null
          last_seen_at?: string | null
          main_goal?: string[] | null
          onboarding_completed?: boolean
          pm_experience?: string | null
          sector?: string | null
          survey_completed?: boolean | null
          survey_completed_at?: string | null
          terms_accepted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_size?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          how_found?: string | null
          id?: string
          is_active?: boolean
          is_admin?: boolean | null
          job_title?: string | null
          last_seen_at?: string | null
          main_goal?: string[] | null
          onboarding_completed?: boolean
          pm_experience?: string | null
          sector?: string | null
          survey_completed?: boolean | null
          survey_completed_at?: string | null
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
      qualitative_research: {
        Row: {
          created_at: string | null
          date: string | null
          desires: string[] | null
          duration_minutes: number | null
          id: string
          insights: string[] | null
          interviewee_company: string | null
          interviewee_name: string
          interviewee_role: string | null
          key_quotes: string[] | null
          method: string | null
          notes: string | null
          pain_points: string[] | null
          product_id: string
          recording_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          desires?: string[] | null
          duration_minutes?: number | null
          id?: string
          insights?: string[] | null
          interviewee_company?: string | null
          interviewee_name: string
          interviewee_role?: string | null
          key_quotes?: string[] | null
          method?: string | null
          notes?: string | null
          pain_points?: string[] | null
          product_id: string
          recording_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          desires?: string[] | null
          duration_minutes?: number | null
          id?: string
          insights?: string[] | null
          interviewee_company?: string | null
          interviewee_name?: string
          interviewee_role?: string | null
          key_quotes?: string[] | null
          method?: string | null
          notes?: string | null
          pain_points?: string[] | null
          product_id?: string
          recording_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualitative_research_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      quantitative_research: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          key_findings: string[] | null
          link: string | null
          metrics: Json | null
          notes: string | null
          objective: string | null
          product_id: string
          start_date: string | null
          status: string | null
          title: string
          tool: string | null
          total_responses: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          key_findings?: string[] | null
          link?: string | null
          metrics?: Json | null
          notes?: string | null
          objective?: string | null
          product_id: string
          start_date?: string | null
          status?: string | null
          title: string
          tool?: string | null
          total_responses?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          key_findings?: string[] | null
          link?: string | null
          metrics?: Json | null
          notes?: string | null
          objective?: string | null
          product_id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          tool?: string | null
          total_responses?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantitative_research_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      release_items: {
        Row: {
          created_at: string
          id: string
          release_id: string
          roadmap_item_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          release_id: string
          roadmap_item_id: string
        }
        Update: {
          created_at?: string
          id?: string
          release_id?: string
          roadmap_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_items_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_items_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          created_at: string
          id: string
          name: string
          planned_date: string
          product_id: string | null
          status: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          planned_date: string
          product_id?: string | null
          status?: string
          user_id: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          planned_date?: string
          product_id?: string | null
          status?: string
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "releases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_ai_suggestions: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          context_audience: string | null
          context_complexity: string | null
          context_description: string | null
          context_evidence: string | null
          context_impact_level: string | null
          context_objective_id: string | null
          created_at: string | null
          id: string
          product_id: string
          reason_confidence: string | null
          reason_effort: string | null
          reason_impact: string | null
          reason_reach: string | null
          suggested_confidence: number | null
          suggested_effort: number | null
          suggested_impact: number | null
          suggested_reach: number | null
          suggested_score: number | null
          task_id: string
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          context_audience?: string | null
          context_complexity?: string | null
          context_description?: string | null
          context_evidence?: string | null
          context_impact_level?: string | null
          context_objective_id?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          reason_confidence?: string | null
          reason_effort?: string | null
          reason_impact?: string | null
          reason_reach?: string | null
          suggested_confidence?: number | null
          suggested_effort?: number | null
          suggested_impact?: number | null
          suggested_reach?: number | null
          suggested_score?: number | null
          task_id: string
          user_id: string
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          context_audience?: string | null
          context_complexity?: string | null
          context_description?: string | null
          context_evidence?: string | null
          context_impact_level?: string | null
          context_objective_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          reason_confidence?: string | null
          reason_effort?: string | null
          reason_impact?: string | null
          reason_reach?: string | null
          suggested_confidence?: number | null
          suggested_effort?: number | null
          suggested_impact?: number | null
          suggested_reach?: number | null
          suggested_score?: number | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rice_ai_suggestions_context_objective_id_fkey"
            columns: ["context_objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rice_ai_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rice_ai_suggestions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "backlog_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      rice_scores: {
        Row: {
          ai_suggested: boolean
          confidence: number
          created_at: string
          effort: number
          id: string
          impact: number
          item_id: string
          item_type: string
          product_id: string | null
          reach: number
          user_id: string
        }
        Insert: {
          ai_suggested?: boolean
          confidence?: number
          created_at?: string
          effort?: number
          id?: string
          impact?: number
          item_id: string
          item_type?: string
          product_id?: string | null
          reach?: number
          user_id: string
        }
        Update: {
          ai_suggested?: boolean
          confidence?: number
          created_at?: string
          effort?: number
          id?: string
          impact?: number
          item_id?: string
          item_type?: string
          product_id?: string | null
          reach?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rice_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_item_key_results: {
        Row: {
          created_at: string | null
          id: string
          key_result_id: string
          kr_contribution: number | null
          roadmap_item_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_result_id: string
          kr_contribution?: number | null
          roadmap_item_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_result_id?: string
          kr_contribution?: number | null
          roadmap_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_item_key_results_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_item_key_results_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_item_tasks: {
        Row: {
          created_at: string | null
          id: string
          roadmap_item_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          roadmap_item_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          roadmap_item_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_item_tasks_roadmap_item_id_fkey"
            columns: ["roadmap_item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_item_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "backlog_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string
          end_date: string | null
          end_month: number
          id: string
          key_result_id: string | null
          kr_contribution: number | null
          objective_id: string | null
          product_id: string | null
          progress: number | null
          progress_updated_at: string
          quarter: string
          start_date: string | null
          start_month: number
          status: string
          theme: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          end_date?: string | null
          end_month?: number
          id?: string
          key_result_id?: string | null
          kr_contribution?: number | null
          objective_id?: string | null
          product_id?: string | null
          progress?: number | null
          progress_updated_at?: string
          quarter: string
          start_date?: string | null
          start_month?: number
          status?: string
          theme?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          end_date?: string | null
          end_month?: number
          id?: string
          key_result_id?: string | null
          kr_contribution?: number | null
          objective_id?: string | null
          product_id?: string | null
          progress?: number | null
          progress_updated_at?: string
          quarter?: string
          start_date?: string | null
          start_month?: number
          status?: string
          theme?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_items_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_activities: {
        Row: {
          activity_date: string
          created_at: string
          description: string
          end_time: string | null
          google_event_id: string | null
          id: string
          last_synced_at: string | null
          product_id: string | null
          sprint_id: string | null
          start_time: string | null
          status: string
          sync_source: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          description?: string
          end_time?: string | null
          google_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          product_id?: string | null
          sprint_id?: string | null
          start_time?: string | null
          status?: string
          sync_source?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          description?: string
          end_time?: string | null
          google_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          product_id?: string | null
          sprint_id?: string | null
          start_time?: string | null
          status?: string
          sync_source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_activities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_activities_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string
          goal: string
          id: string
          name: string
          product_id: string | null
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          goal?: string
          id?: string
          name: string
          product_id?: string | null
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goal?: string
          id?: string
          name?: string
          product_id?: string | null
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      swot_analyses: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          objective_id: string | null
          product_id: string | null
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          objective_id?: string | null
          product_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          objective_id?: string | null
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swot_analyses_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swot_analyses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      usability_tests: {
        Row: {
          created_at: string | null
          date: string | null
          findings: string[] | null
          id: string
          improvements: string[] | null
          objective: string | null
          participants: number | null
          product_id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          findings?: string[] | null
          id?: string
          improvements?: string[] | null
          objective?: string | null
          participants?: number | null
          product_id: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          findings?: string[] | null
          id?: string
          improvements?: string[] | null
          objective?: string | null
          participants?: number | null
          product_id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usability_tests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interviews: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          interviewee_name: string
          interviewee_role: string | null
          key_insights: string[] | null
          notes: string | null
          pain_points: string[] | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          interviewee_name: string
          interviewee_role?: string | null
          key_insights?: string[] | null
          notes?: string | null
          pain_points?: string[] | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          interviewee_name?: string
          interviewee_role?: string | null
          key_insights?: string[] | null
          notes?: string | null
          pain_points?: string[] | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_activate_sprints: { Args: never; Returns: undefined }
      auto_update_sprint_status: { Args: never; Returns: undefined }
      check_stale_roadmap_items: { Args: never; Returns: undefined }
      create_notification:
        | {
            Args: {
              _message: string
              _title: string
              _type?: string
              _user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _action_url?: string
              _message: string
              _metadata?: Json
              _title: string
              _type?: string
              _user_id: string
            }
            Returns: undefined
          }
      delete_user_account: { Args: never; Returns: undefined }
      has_product_role: {
        Args: { _product_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      invite_product_member: {
        Args: { _email: string; _product_id: string; _role: string }
        Returns: Json
      }
      is_app_admin: { Args: { _user_id: string }; Returns: boolean }
      is_product_member: {
        Args: { _product_id: string; _user_id: string }
        Returns: boolean
      }
      notify_product_members: {
        Args: {
          _action_url?: string
          _exclude_user_id: string
          _message: string
          _product_id: string
          _title: string
          _type?: string
        }
        Returns: undefined
      }
      seed_example_data: { Args: { new_user_id: string }; Returns: undefined }
      touch_last_seen: { Args: never; Returns: undefined }
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
    Enums: {},
  },
} as const
