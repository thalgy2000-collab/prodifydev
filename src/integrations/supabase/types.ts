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
          id: string
          sort_order: number
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          sort_order?: number
          task_id?: string
          title?: string
        }
        Relationships: [
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
          created_at: string
          description: string
          due_date: string | null
          id: string
          initiative_id: string | null
          key_result_id: string | null
          objective_id: string | null
          priority: string
          product_id: string | null
          returned_from_sprint_id: string | null
          sprint_id: string | null
          status: string
          story_points: number | null
          title: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          category?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          initiative_id?: string | null
          key_result_id?: string | null
          objective_id?: string | null
          priority?: string
          product_id?: string | null
          returned_from_sprint_id?: string | null
          sprint_id?: string | null
          status?: string
          story_points?: number | null
          title: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          category?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          initiative_id?: string | null
          key_result_id?: string | null
          objective_id?: string | null
          priority?: string
          product_id?: string | null
          returned_from_sprint_id?: string | null
          sprint_id?: string | null
          status?: string
          story_points?: number | null
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
            foreignKeyName: "backlog_tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
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
      key_results: {
        Row: {
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
      objectives: {
        Row: {
          category: string
          created_at: string
          id: string
          product_id: string | null
          quarter: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          product_id?: string | null
          quarter: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          product_id?: string | null
          quarter?: string
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
      products: {
        Row: {
          color: string
          created_at: string
          description: string
          emoji: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
        }
        Relationships: []
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
      rice_scores: {
        Row: {
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
      roadmap_items: {
        Row: {
          category: string
          color: string
          created_at: string
          description: string
          end_month: number
          id: string
          key_result_id: string | null
          kr_contribution: number | null
          objective_id: string | null
          product_id: string | null
          quarter: string
          start_month: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          end_month?: number
          id?: string
          key_result_id?: string | null
          kr_contribution?: number | null
          objective_id?: string | null
          product_id?: string | null
          quarter: string
          start_month?: number
          status?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          description?: string
          end_month?: number
          id?: string
          key_result_id?: string | null
          kr_contribution?: number | null
          objective_id?: string | null
          product_id?: string | null
          quarter?: string
          start_month?: number
          status?: string
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
          id: string
          product_id: string | null
          sprint_id: string | null
          start_time: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          description?: string
          end_time?: string | null
          id?: string
          product_id?: string | null
          sprint_id?: string | null
          start_time?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          description?: string
          end_time?: string | null
          id?: string
          product_id?: string | null
          sprint_id?: string | null
          start_time?: string | null
          status?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_product_role: {
        Args: { _product_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      invite_product_member: {
        Args: { _email: string; _product_id: string; _role: string }
        Returns: Json
      }
      is_product_member: {
        Args: { _product_id: string; _user_id: string }
        Returns: boolean
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
