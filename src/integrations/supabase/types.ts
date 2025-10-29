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
      access_requests: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          request_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          request_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          request_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_account: {
        Row: {
          active: boolean | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_event_account: {
        Row: {
          business_account_id: string
          created_at: string | null
          event_id: string
          id: string
        }
        Insert: {
          business_account_id: string
          created_at?: string | null
          event_id: string
          id?: string
        }
        Update: {
          business_account_id?: string
          created_at?: string | null
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
      business_event_contact: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          event_id: string
          id: string
          name: string | null
          phone: string | null
          phone_number: string | null
          role: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          event_id: string
          id?: string
          name?: string | null
          phone?: string | null
          phone_number?: string | null
          role?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string
          id?: string
          name?: string | null
          phone?: string | null
          phone_number?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_event_contact_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
        ]
      }
      business_event_hotel: {
        Row: {
          address: string | null
          check_in: string | null
          check_out: string | null
          confirmation_code: string | null
          created_at: string | null
          event_id: string
          hotel_name: string | null
          id: string
          notes: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          check_in?: string | null
          check_out?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          event_id: string
          hotel_name?: string | null
          id?: string
          notes?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          check_in?: string | null
          check_out?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          event_id?: string
          hotel_name?: string | null
          id?: string
          notes?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_event_hotel_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_event_hotel_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_event_talent: {
        Row: {
          created_at: string | null
          currency: string | null
          event_id: string
          id: string
          notes: string | null
          rate: number | null
          talent_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          event_id: string
          id?: string
          notes?: string | null
          rate?: number | null
          talent_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          rate?: number | null
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
          arrival_date: string | null
          confirmation_code: string | null
          created_at: string | null
          departure_date: string | null
          event_id: string
          flight_number: string | null
          id: string
          notes: string | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          arrival_date?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          departure_date?: string | null
          event_id: string
          flight_number?: string | null
          id?: string
          notes?: string | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          arrival_date?: string | null
          confirmation_code?: string | null
          created_at?: string | null
          departure_date?: string | null
          event_id?: string
          flight_number?: string | null
          id?: string
          notes?: string | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_event_travel_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_event_travel_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_ts: string | null
          id: string
          location: string | null
          start_ts: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_ts?: string | null
          id?: string
          location?: string | null
          start_ts?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_ts?: string | null
          id?: string
          location?: string | null
          start_ts?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_talent_access: {
        Row: {
          business_user_id: string
          granted_at: string | null
          id: string
          talent_id: string
        }
        Insert: {
          business_user_id: string
          granted_at?: string | null
          id?: string
          talent_id: string
        }
        Update: {
          business_user_id?: string
          granted_at?: string | null
          id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_talent_access_talent_id_fkey"
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
          all_day: boolean | null
          color: string | null
          created_at: string | null
          created_by: string | null
          end_date: string
          end_time: string | null
          event_title: string
          id: string
          location_city: string | null
          location_country: string | null
          location_state: string | null
          notes_internal: string | null
          notes_public: string | null
          start_date: string
          start_time: string | null
          status: string | null
          talent_id: string
          timezone: string | null
          updated_at: string | null
          venue_name: string | null
        }
        Insert: {
          address_line?: string | null
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date: string
          end_time?: string | null
          event_title: string
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          notes_internal?: string | null
          notes_public?: string | null
          start_date: string
          start_time?: string | null
          status?: string | null
          talent_id: string
          timezone?: string | null
          updated_at?: string | null
          venue_name?: string | null
        }
        Update: {
          address_line?: string | null
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          end_time?: string | null
          event_title?: string
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          notes_internal?: string | null
          notes_public?: string | null
          start_date?: string
          start_time?: string | null
          status?: string | null
          talent_id?: string
          timezone?: string | null
          updated_at?: string | null
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
      event_dates: {
        Row: {
          active: boolean | null
          created_at: string | null
          date_label: string | null
          date_value: string | null
          display_order: number | null
          event_date: string
          event_id: string
          id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          date_label?: string | null
          date_value?: string | null
          display_order?: number | null
          event_date: string
          event_id: string
          id?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          date_label?: string | null
          date_value?: string | null
          display_order?: number | null
          event_date?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_dates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
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
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          subject: string | null
          thread_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          subject?: string | null
          thread_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string | null
          thread_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_scope: string
          role_key: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_scope: string
          role_key: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_scope?: string
          role_key?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      schedule_bulk_uploads: {
        Row: {
          created_at: string | null
          entry_count: number | null
          event_id: string
          id: string
          upload_date: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          entry_count?: number | null
          event_id: string
          id?: string
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          entry_count?: number | null
          event_id?: string
          id?: string
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_bulk_uploads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_categories: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      show_schedule_entries: {
        Row: {
          active: boolean | null
          category_id: string | null
          created_at: string | null
          day_date: string | null
          details: string | null
          display_order: number | null
          event_date_id: string
          event_id: string
          id: string
          time_end: string | null
          time_start: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          day_date?: string | null
          details?: string | null
          display_order?: number | null
          event_date_id: string
          event_id: string
          id?: string
          time_end?: string | null
          time_start: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          created_at?: string | null
          day_date?: string | null
          details?: string | null
          display_order?: number | null
          event_date_id?: string
          event_id?: string
          id?: string
          time_end?: string | null
          time_start?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "show_schedule_entries_event_date_id_fkey"
            columns: ["event_date_id"]
            isOneToOne: false
            referencedRelation: "event_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_schedule_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
        ]
      }
      site_design_settings: {
        Row: {
          created_at: string | null
          id: string
          settings: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      talent_assets: {
        Row: {
          active: boolean | null
          category: Database["public"]["Enums"]["asset_category"]
          created_at: string | null
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          format: Database["public"]["Enums"]["asset_format"]
          id: string
          metadata: Json | null
          talent_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: Database["public"]["Enums"]["asset_category"]
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          format: Database["public"]["Enums"]["asset_format"]
          id?: string
          metadata?: Json | null
          talent_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: Database["public"]["Enums"]["asset_category"]
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          format?: Database["public"]["Enums"]["asset_format"]
          id?: string
          metadata?: Json | null
          talent_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_assets_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_module_access: {
        Row: {
          created_at: string | null
          id: string
          is_locked: boolean | null
          module_id: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          module_id: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          module_id?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_module_access_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_personal_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_id: string | null
          id: string
          notes: string | null
          schedule_date: string
          schedule_type: string | null
          talent_id: string
          time_end: string | null
          time_start: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          schedule_date: string
          schedule_type?: string | null
          talent_id: string
          time_end?: string | null
          time_start?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          schedule_date?: string
          schedule_type?: string | null
          talent_id?: string
          time_end?: string | null
          time_start?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_personal_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "business_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_personal_schedules_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          active: boolean | null
          bio: string | null
          created_at: string | null
          headshot_url: string | null
          id: string
          name: string
          public_visibility: boolean | null
          slug: string | null
          sort_rank: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          created_at?: string | null
          headshot_url?: string | null
          id?: string
          name: string
          public_visibility?: boolean | null
          slug?: string | null
          sort_rank?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          created_at?: string | null
          headshot_url?: string | null
          id?: string
          name?: string
          public_visibility?: boolean | null
          slug?: string | null
          sort_rank?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      talent_quick_view: {
        Row: {
          created_at: string | null
          id: string
          settings: Json | null
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          settings?: Json | null
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_quick_view_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string | null
          activity_type: string | null
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          activity_type?: string | null
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          activity_type?: string | null
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profile_data: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          section_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          section_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          section_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watermark_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          opacity: number | null
          position: string | null
          text: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          opacity?: number | null
          position?: string | null
          text?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          opacity?: number | null
          position?: string | null
          text?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_business_account_exists: {
        Args: { _user_id: string }
        Returns: string
      }
      get_users_for_messaging: {
        Args: never
        Returns: {
          display_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manage_event_date:
        | {
            Args: {
              p_action?: string
              p_date_value: string
              p_event_id: string
            }
            Returns: string
          }
        | { Args: { _event_date: string; _event_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "staff" | "talent" | "business"
      asset_category:
        | "headshot"
        | "character_image"
        | "bio"
        | "promo_video"
        | "general"
      asset_format: "image" | "video" | "document"
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
      asset_category: [
        "headshot",
        "character_image",
        "bio",
        "promo_video",
        "general",
      ],
      asset_format: ["image", "video", "document"],
    },
  },
} as const
