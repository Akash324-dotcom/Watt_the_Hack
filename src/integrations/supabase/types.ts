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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      circle_achievements: {
        Row: {
          achieved_at: string | null
          badge_emoji: string | null
          badge_name: string
          circle_id: string | null
          id: string
        }
        Insert: {
          achieved_at?: string | null
          badge_emoji?: string | null
          badge_name: string
          circle_id?: string | null
          id?: string
        }
        Update: {
          achieved_at?: string | null
          badge_emoji?: string | null
          badge_name?: string
          circle_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_achievements_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string | null
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          circle_id?: string | null
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          circle_id?: string | null
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_messages: {
        Row: {
          circle_id: string | null
          created_at: string | null
          id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          circle_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          circle_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_messages_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_post_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          post_id: string
          user_id: string
          username: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
          username: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_posts: {
        Row: {
          caption: string
          circle_id: string
          comments_count: number
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          user_id: string
          username: string
        }
        Insert: {
          caption: string
          circle_id: string
          comments_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          user_id: string
          username: string
        }
        Update: {
          caption?: string
          circle_id?: string
          comments_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_posts_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          location: string
          name: string
          points: number | null
          type: string
          weekly_points: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          location: string
          name: string
          points?: number | null
          type: string
          weekly_points?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          location?: string
          name?: string
          points?: number | null
          type?: string
          weekly_points?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_actions: {
        Row: {
          action_type: string
          created_at: string
          date: string
          day: string
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          date?: string
          day: string
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          date?: string
          day?: string
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_circle_member_count: {
        Args: { circle_uuid: string }
        Returns: number
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
