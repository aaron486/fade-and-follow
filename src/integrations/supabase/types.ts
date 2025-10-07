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
      bets: {
        Row: {
          action_type: string | null
          channel_id: string | null
          created_at: string
          event_name: string
          id: string
          market: string
          notes: string | null
          odds: number
          pick_id: string | null
          placed_at: string
          resolved_at: string | null
          selection: string
          sport: string
          stake_units: number
          status: string
          team_id: string | null
          units: number | null
          updated_at: string
          user_id: string
          wager_amount: number | null
        }
        Insert: {
          action_type?: string | null
          channel_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          market: string
          notes?: string | null
          odds: number
          pick_id?: string | null
          placed_at?: string
          resolved_at?: string | null
          selection: string
          sport: string
          stake_units?: number
          status?: string
          team_id?: string | null
          units?: number | null
          updated_at?: string
          user_id: string
          wager_amount?: number | null
        }
        Update: {
          action_type?: string | null
          channel_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          market?: string
          notes?: string | null
          odds?: number
          pick_id?: string | null
          placed_at?: string
          resolved_at?: string | null
          selection?: string
          sport?: string
          stake_units?: number
          status?: string
          team_id?: string | null
          units?: number | null
          updated_at?: string
          user_id?: string
          wager_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_pick_id_fkey"
            columns: ["pick_id"]
            isOneToOne: false
            referencedRelation: "picks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bets_channel"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bets_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_channel_members_channel"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          type: Database["public"]["Enums"]["chat_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["chat_type"]
          updated_at?: string
        }
        Relationships: []
      }
      feed_items: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          published_at: string | null
          source_url: string | null
          sport: string
          summary: string | null
          team_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          published_at?: string | null
          source_url?: string | null
          sport: string
          summary?: string | null
          team_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          published_at?: string | null
          source_url?: string | null
          sport?: string
          summary?: string | null
          team_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friendships_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      picks: {
        Row: {
          confidence: string
          created_at: string
          event_name: string
          fades_count: number
          id: string
          is_public: boolean
          market: string
          odds: number
          reasoning: string | null
          resolved_at: string | null
          selection: string
          sport: string
          stake_units: number
          status: string
          tails_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          event_name: string
          fades_count?: number
          id?: string
          is_public?: boolean
          market: string
          odds: number
          reasoning?: string | null
          resolved_at?: string | null
          selection: string
          sport: string
          stake_units?: number
          status?: string
          tails_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string
          created_at?: string
          event_name?: string
          fades_count?: number
          id?: string
          is_public?: boolean
          market?: string
          odds?: number
          reasoning?: string | null
          resolved_at?: string | null
          selection?: string
          sport?: string
          stake_units?: number
          status?: string
          tails_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bettor_level: string | null
          created_at: string
          current_streak: number | null
          discord_url: string | null
          display_name: string | null
          favorite_team: string | null
          favorite_teams: string[] | null
          id: string
          instagram_url: string | null
          losses: number | null
          preferred_sportsbook: string | null
          state: string | null
          streak_type: string | null
          tiktok_url: string | null
          total_bets: number | null
          updated_at: string
          user_id: string
          username: string | null
          wins: number | null
          x_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bettor_level?: string | null
          created_at?: string
          current_streak?: number | null
          discord_url?: string | null
          display_name?: string | null
          favorite_team?: string | null
          favorite_teams?: string[] | null
          id?: string
          instagram_url?: string | null
          losses?: number | null
          preferred_sportsbook?: string | null
          state?: string | null
          streak_type?: string | null
          tiktok_url?: string | null
          total_bets?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          wins?: number | null
          x_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bettor_level?: string | null
          created_at?: string
          current_streak?: number | null
          discord_url?: string | null
          display_name?: string | null
          favorite_team?: string | null
          favorite_teams?: string[] | null
          id?: string
          instagram_url?: string | null
          losses?: number | null
          preferred_sportsbook?: string | null
          state?: string | null
          streak_type?: string | null
          tiktok_url?: string | null
          total_bets?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          wins?: number | null
          x_url?: string | null
        }
        Relationships: []
      }
      public_bettor_records: {
        Row: {
          bettor_id: string
          created_at: string | null
          current_streak: number
          last_pick_at: string | null
          longest_streak: number
          losses: number
          pushes: number
          units_won: number
          updated_at: string | null
          wins: number
        }
        Insert: {
          bettor_id: string
          created_at?: string | null
          current_streak?: number
          last_pick_at?: string | null
          longest_streak?: number
          losses?: number
          pushes?: number
          units_won?: number
          updated_at?: string | null
          wins?: number
        }
        Update: {
          bettor_id?: string
          created_at?: string | null
          current_streak?: number
          last_pick_at?: string | null
          longest_streak?: number
          losses?: number
          pushes?: number
          units_won?: number
          updated_at?: string | null
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_bettor_records_bettor_id_fkey"
            columns: ["bettor_id"]
            isOneToOne: true
            referencedRelation: "public_bettors"
            referencedColumns: ["id"]
          },
        ]
      }
      public_bettors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          follower_count: number | null
          id: string
          is_verified: boolean | null
          social_handles: Json | null
          source_urls: string[] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          follower_count?: number | null
          id?: string
          is_verified?: boolean | null
          social_handles?: Json | null
          source_urls?: string[] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          follower_count?: number | null
          id?: string
          is_verified?: boolean | null
          social_handles?: Json | null
          source_urls?: string[] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      public_picks: {
        Row: {
          bettor_id: string
          confidence: string | null
          created_at: string | null
          event_name: string
          id: string
          market: string
          odds: number
          posted_at: string
          reasoning: string | null
          resolved_at: string | null
          selection: string
          source_post_id: string | null
          source_url: string | null
          sport: string
          stake_units: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          bettor_id: string
          confidence?: string | null
          created_at?: string | null
          event_name: string
          id?: string
          market: string
          odds: number
          posted_at: string
          reasoning?: string | null
          resolved_at?: string | null
          selection: string
          source_post_id?: string | null
          source_url?: string | null
          sport: string
          stake_units?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          bettor_id?: string
          confidence?: string | null
          created_at?: string | null
          event_name?: string
          id?: string
          market?: string
          odds?: number
          posted_at?: string
          reasoning?: string | null
          resolved_at?: string | null
          selection?: string
          source_post_id?: string | null
          source_url?: string | null
          sport?: string
          stake_units?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_picks_bettor_id_fkey"
            columns: ["bettor_id"]
            isOneToOne: false
            referencedRelation: "public_bettors"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          league: string
          logo_url: string | null
          mascot: string
          name: string
          sport: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          league: string
          logo_url?: string | null
          mascot: string
          name: string
          sport: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          league?: string
          logo_url?: string | null
          mascot?: string
          name?: string
          sport?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_records: {
        Row: {
          created_at: string
          current_streak: number
          longest_streak: number
          losses: number
          pushes: number
          units_won: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          longest_streak?: number
          losses?: number
          pushes?: number
          units_won?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          longest_streak?: number
          losses?: number
          pushes?: number
          units_won?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_users_friends: {
        Args: { _user1_id: string; _user2_id: string }
        Returns: boolean
      }
      calculate_user_betting_stats: {
        Args: { target_user_id: string }
        Returns: {
          current_streak: number
          losses: number
          pushes: number
          roi_percentage: number
          streak_type: string
          total_bets: number
          total_units_wagered: number
          total_units_won: number
          win_percentage: number
          wins: number
        }[]
      }
      is_channel_admin: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_channel_creator: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_first_channel_member: {
        Args: { _channel_id: string }
        Returns: boolean
      }
      update_public_bettor_stats: {
        Args: { target_bettor_id: string }
        Returns: undefined
      }
      update_user_records_stats: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      chat_type: "direct" | "group"
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
      chat_type: ["direct", "group"],
    },
  },
} as const
