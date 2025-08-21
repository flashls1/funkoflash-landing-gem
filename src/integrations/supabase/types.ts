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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      business_account: {
        Row: {
          address_line: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      business_event_account: {
        Row: {
          business_account_id: string
          event_id: string
          id: string
        }
        Insert: {
          business_account_id: string
          event_id: string
          id?: string
        }
        Update: {
          business_account_id?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_event_account_business_account_id_fkey"
            columns: ["business_account_id"]
            isOneToOne: false
            referencedRelation: "business_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_event_account_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
        ]
      }
      business_event_hotel: {
        Row: {
          checkin_date: string | null
          checkout_date: string | null
          confirmation_number: string | null
          created_at: string
          created_by: string | null
          event_id: string
          hotel_address: string | null
          hotel_name: string | null
          id: string
          notes: string | null
          talent_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          checkin_date?: string | null
          checkout_date?: string | null
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          event_id: string
          hotel_address?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          talent_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          checkin_date?: string | null
          checkout_date?: string | null
          confirmation_number?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string
          hotel_address?: string | null
          hotel_name?: string | null
          id?: string
          notes?: string | null
          talent_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      business_event_talent: {
        Row: {
          event_id: string
          guarantee_amount: number | null
          guarantee_currency: string | null
          id: string
          per_diem_amount: number | null
          per_diem_currency: string | null
          talent_id: string
        }
        Insert: {
          event_id: string
          guarantee_amount?: number | null
          guarantee_currency?: string | null
          id?: string
          per_diem_amount?: number | null
          per_diem_currency?: string | null
          talent_id: string
        }
        Update: {
          event_id?: string
          guarantee_amount?: number | null
          guarantee_currency?: string | null
          id?: string
          per_diem_amount?: number | null
          per_diem_currency?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_event_talent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_event_talent_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_event_travel: {
        Row: {
          airline_name: string | null
          arrival_datetime: string | null
          confirmation_codes: string | null
          created_at: string
          created_by: string | null
          departure_datetime: string | null
          event_id: string
          flight_tickets_url: string | null
          id: string
          notes: string | null
          status: string | null
          talent_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          airline_name?: string | null
          arrival_datetime?: string | null
          confirmation_codes?: string | null
          created_at?: string
          created_by?: string | null
          departure_datetime?: string | null
          event_id: string
          flight_tickets_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          talent_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          airline_name?: string | null
          arrival_datetime?: string | null
          confirmation_codes?: string | null
          created_at?: string
          created_by?: string | null
          departure_datetime?: string | null
          event_id?: string
          flight_tickets_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          talent_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      business_events: {
        Row: {
          address_line: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          daily_schedule: Json | null
          end_ts: string | null
          hero_logo_path: string | null
          id: string
          primary_business_id: string | null
          start_ts: string | null
          state: string | null
          status: string | null
          title: string | null
          updated_at: string
          venue: string | null
          website: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          daily_schedule?: Json | null
          end_ts?: string | null
          hero_logo_path?: string | null
          id?: string
          primary_business_id?: string | null
          start_ts?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          venue?: string | null
          website?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          daily_schedule?: Json | null
          end_ts?: string | null
          hero_logo_path?: string | null
          id?: string
          primary_business_id?: string | null
          start_ts?: string | null
          state?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          venue?: string | null
          website?: string | null
        }
        Relationships: []
      }
      business_talent_access: {
        Row: {
          business_event_id: string
          granted_at: string
          granted_by: string | null
          id: string
          talent_id: string
        }
        Insert: {
          business_event_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          talent_id: string
        }
        Update: {
          business_event_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_business_talent_access_event_id"
            columns: ["business_event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_business_talent_access_talent_id"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event: {
        Row: {
          address_line: string | null
          all_day: boolean
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          do_not_sync: boolean | null
          end_date: string
          end_time: string | null
          event_title: string
          gcal_event_id: string | null
          id: string
          last_synced_at: string | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          notes_internal: string | null
          notes_public: string | null
          source_file: string | null
          source_row_id: string | null
          start_date: string
          start_time: string | null
          status: string
          talent_id: string | null
          timezone: string | null
          travel_in: string | null
          travel_out: string | null
          updated_at: string
          updated_by: string | null
          url: string | null
          venue_name: string | null
        }
        Insert: {
          address_line?: string | null
          all_day?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          do_not_sync?: boolean | null
          end_date: string
          end_time?: string | null
          event_title: string
          gcal_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          notes_internal?: string | null
          notes_public?: string | null
          source_file?: string | null
          source_row_id?: string | null
          start_date: string
          start_time?: string | null
          status?: string
          talent_id?: string | null
          timezone?: string | null
          travel_in?: string | null
          travel_out?: string | null
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          venue_name?: string | null
        }
        Update: {
          address_line?: string | null
          all_day?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          do_not_sync?: boolean | null
          end_date?: string
          end_time?: string | null
          event_title?: string
          gcal_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          notes_internal?: string | null
          notes_public?: string | null
          source_file?: string | null
          source_row_id?: string | null
          start_date?: string
          start_time?: string | null
          status?: string
          talent_id?: string | null
          timezone?: string | null
          travel_in?: string | null
          travel_out?: string | null
          updated_at?: string
          updated_by?: string | null
          url?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_settings: {
        Row: {
          banner_alt_text: string | null
          banner_image_url: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          banner_alt_text?: string | null
          banner_image_url?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          banner_alt_text?: string | null
          banner_image_url?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_talent_assignments: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string | null
          talent_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string | null
          talent_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string | null
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_talent_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_talent_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          external_url: string | null
          hero_image_url: string | null
          id: string
          location: string | null
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          visibility_end: string | null
          visibility_start: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          external_url?: string | null
          hero_image_url?: string | null
          id?: string
          location?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          visibility_end?: string | null
          visibility_start?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          external_url?: string | null
          hero_image_url?: string | null
          id?: string
          location?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          visibility_end?: string | null
          visibility_start?: string | null
        }
        Relationships: []
      }
      gcal_connections: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          created_by: string | null
          google_email: string
          id: string
          refresh_token: string
          talent_id: string
          token_expiry: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          access_token: string
          calendar_id: string
          created_at?: string
          created_by?: string | null
          google_email: string
          id?: string
          refresh_token: string
          talent_id: string
          token_expiry: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          created_by?: string | null
          google_email?: string
          id?: string
          refresh_token?: string
          talent_id?: string
          token_expiry?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          subject: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          browser_notifications: boolean
          created_at: string
          do_not_disturb_end: string | null
          do_not_disturb_start: string | null
          email_notifications: boolean
          id: string
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean
          created_at?: string
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          email_notifications?: boolean
          id?: string
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_notifications?: boolean
          created_at?: string
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          email_notifications?: boolean
          id?: string
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          scope: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          background_image_url: string | null
          business_name: string | null
          created_at: string
          created_by: string | null
          email: string
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          name_color: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          background_image_url?: string | null
          business_name?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          name_color?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          background_image_url?: string | null
          business_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          name_color?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_scope: string
          role_key: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_scope: string
          role_key: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_scope?: string
          role_key?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_scope_fkey"
            columns: ["permission_scope"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["scope"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          active: boolean
          autoplay_interval: number
          created_at: string
          description: string
          id: string
          image_urls: Json | null
          price: number
          square_checkout_url: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          autoplay_interval?: number
          created_at?: string
          description: string
          id?: string
          image_urls?: Json | null
          price: number
          square_checkout_url: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          autoplay_interval?: number
          created_at?: string
          description?: string
          id?: string
          image_urls?: Json | null
          price?: number
          square_checkout_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_design_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          page_name: string
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_name: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          page_name?: string
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      talent_assets: {
        Row: {
          active: boolean | null
          category: Database["public"]["Enums"]["asset_category"]
          content_data: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          file_size: number | null
          file_url: string | null
          format: Database["public"]["Enums"]["asset_format"] | null
          id: string
          is_featured: boolean | null
          talent_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean | null
          category: Database["public"]["Enums"]["asset_category"]
          content_data?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["asset_format"] | null
          id?: string
          is_featured?: boolean | null
          talent_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean | null
          category?: Database["public"]["Enums"]["asset_category"]
          content_data?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["asset_format"] | null
          id?: string
          is_featured?: boolean | null
          talent_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_talent_assets_talent_id"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          headshot_url: string | null
          id: string
          name: string
          slug: string
          sort_rank: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          headshot_url?: string | null
          id?: string
          name: string
          slug: string
          sort_rank?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          headshot_url?: string | null
          id?: string
          name?: string
          slug?: string
          sort_rank?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ui_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_impersonation_sessions: {
        Row: {
          active: boolean
          admin_user_id: string
          ended_at: string | null
          id: string
          started_at: string
          target_user_id: string
        }
        Insert: {
          active?: boolean
          admin_user_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          target_user_id: string
        }
        Update: {
          active?: boolean
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          target_user_id?: string
        }
        Relationships: []
      }
      user_login_history: {
        Row: {
          id: string
          ip_address: string
          location_info: Json | null
          login_time: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address: string
          location_info?: Json | null
          login_time?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string
          location_info?: Json | null
          login_time?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watermark_settings: {
        Row: {
          business_logo_url: string | null
          business_position: string | null
          default_position: string | null
          id: string
          logo_size: number | null
          logo_url: string | null
          opacity: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_logo_url?: string | null
          business_position?: string | null
          default_position?: string | null
          id?: string
          logo_size?: number | null
          logo_url?: string | null
          opacity?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_logo_url?: string | null
          business_position?: string | null
          default_position?: string | null
          id?: string
          logo_size?: number | null
          logo_url?: string | null
          opacity?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          background_image_url: string | null
          business_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          name_color: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          background_image_url?: string | null
          business_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          name_color?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          background_image_url?: string | null
          business_name?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          name_color?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_calendar_year: {
        Args: { p_talent_id: string; p_year: number }
        Returns: number
      }
      delete_user_and_files_completely: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      delete_user_completely: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      ensure_business_account_exists: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_gcal_tokens: {
        Args: { p_talent_id: string }
        Returns: {
          access_token: string
          calendar_id: string
          google_email: string
          refresh_token: string
          token_expiry: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_for_messaging: {
        Args: Record<PropertyKey, never>
        Returns: {
          display_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      has_permission: {
        Args: { p_scope: string; p_uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      track_user_login: {
        Args: {
          p_ip_address: string
          p_location_info?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      validate_attachment_url: {
        Args: { url: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "talent" | "business"
      asset_category: "headshot" | "character_image" | "bio" | "promo_video"
      asset_format: "transparent_png" | "png" | "jpeg" | "mp4" | "rich_text"
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
      app_role: ["admin", "staff", "talent", "business"],
      asset_category: ["headshot", "character_image", "bio", "promo_video"],
      asset_format: ["transparent_png", "png", "jpeg", "mp4", "rich_text"],
    },
  },
} as const
