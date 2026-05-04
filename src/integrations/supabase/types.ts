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
      admin_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_cadencia_steps: {
        Row: {
          created_at: string | null
          delay_minutes: number
          id: string
          message_content: string
          rule_id: string
          send_if_replied: boolean
          step_order: number
        }
        Insert: {
          created_at?: string | null
          delay_minutes?: number
          id?: string
          message_content: string
          rule_id: string
          send_if_replied?: boolean
          step_order?: number
        }
        Update: {
          created_at?: string | null
          delay_minutes?: number
          id?: string
          message_content?: string
          rule_id?: string
          send_if_replied?: boolean
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "auto_cadencia_steps_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "broker_auto_cadencia_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_followups: {
        Row: {
          attempt_number: number
          broker_id: string
          conversation_id: string
          id: string
          message_preview: string | null
          sent_at: string
        }
        Insert: {
          attempt_number?: number
          broker_id: string
          conversation_id: string
          id?: string
          message_preview?: string | null
          sent_at?: string
        }
        Update: {
          attempt_number?: number
          broker_id?: string
          conversation_id?: string
          id?: string
          message_preview?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autopilot_followups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_activity_logs: {
        Row: {
          activity_type: string
          broker_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          lead_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          broker_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          broker_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_activity_logs_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_activity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_auto_cadencia_rules: {
        Row: {
          broker_id: string
          cadence_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          cadence_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          cadence_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_auto_cadencia_rules_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_auto_cadencia_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_auto_message_rules: {
        Row: {
          broker_id: string
          created_at: string | null
          delay_minutes: number | null
          id: string
          is_active: boolean | null
          message_content: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          is_active?: boolean | null
          message_content: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          is_active?: boolean | null
          message_content?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_auto_message_rules_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_auto_message_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_projects: {
        Row: {
          broker_id: string
          created_at: string
          id: string
          is_active: boolean
          project_id: string
        }
        Insert: {
          broker_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          project_id: string
        }
        Update: {
          broker_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_projects_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_sessions: {
        Row: {
          broker_id: string
          id: string
          ip_address: string | null
          last_activity_at: string
          logged_in_at: string
          login_method: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          broker_id: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          logged_in_at?: string
          login_method?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          broker_id?: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          logged_in_at?: string
          login_method?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_sessions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_whatsapp_instances: {
        Row: {
          broker_id: string
          connected_at: string | null
          created_at: string | null
          daily_limit: number | null
          daily_sent_count: number | null
          hourly_limit: number | null
          hourly_sent_count: number | null
          id: string
          instance_name: string
          instance_token: string | null
          is_paused: boolean | null
          last_seen_at: string | null
          organization_id: string | null
          pause_reason: string | null
          phone_number: string | null
          risk_score: number | null
          status: string
          updated_at: string | null
          warmup_day: number | null
          warmup_stage: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          broker_id: string
          connected_at?: string | null
          created_at?: string | null
          daily_limit?: number | null
          daily_sent_count?: number | null
          hourly_limit?: number | null
          hourly_sent_count?: number | null
          id?: string
          instance_name: string
          instance_token?: string | null
          is_paused?: boolean | null
          last_seen_at?: string | null
          organization_id?: string | null
          pause_reason?: string | null
          phone_number?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string | null
          warmup_day?: number | null
          warmup_stage?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          broker_id?: string
          connected_at?: string | null
          created_at?: string | null
          daily_limit?: number | null
          daily_sent_count?: number | null
          hourly_limit?: number | null
          hourly_sent_count?: number | null
          id?: string
          instance_name?: string
          instance_token?: string | null
          is_paused?: boolean | null
          last_seen_at?: string | null
          organization_id?: string | null
          pause_reason?: string | null
          phone_number?: string | null
          risk_score?: number | null
          status?: string
          updated_at?: string | null
          warmup_day?: number | null
          warmup_stage?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_whatsapp_instances_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: true
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          copilot_enabled: boolean
          created_at: string
          email: string
          global_display_name: string | null
          id: string
          inbox_enabled: boolean
          is_active: boolean
          lider_id: string | null
          name: string
          nome_equipe: string | null
          organization_id: string | null
          show_name_on_global: boolean
          slug: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          copilot_enabled?: boolean
          created_at?: string
          email: string
          global_display_name?: string | null
          id?: string
          inbox_enabled?: boolean
          is_active?: boolean
          lider_id?: string | null
          name: string
          nome_equipe?: string | null
          organization_id?: string | null
          show_name_on_global?: boolean
          slug: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          copilot_enabled?: boolean
          created_at?: string
          email?: string
          global_display_name?: string | null
          id?: string
          inbox_enabled?: boolean
          is_active?: boolean
          lider_id?: string | null
          name?: string
          nome_equipe?: string | null
          organization_id?: string | null
          show_name_on_global?: boolean
          slug?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          broker_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          event_type: string
          google_event_id: string | null
          id: string
          lead_id: string | null
          location: string | null
          organization_id: string | null
          project_id: string | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          broker_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          organization_id?: string | null
          project_id?: string | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          broker_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_type?: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          organization_id?: string | null
          project_id?: string | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_steps: {
        Row: {
          campaign_id: string
          created_at: string
          delay_minutes: number
          id: string
          message_content: string
          send_if_replied: boolean
          step_order: number
          template_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          delay_minutes?: number
          id?: string
          message_content: string
          send_if_replied?: boolean
          step_order?: number
          template_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          delay_minutes?: number
          id?: string
          message_content?: string
          send_if_replied?: boolean
          step_order?: number
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_type: string
          metadata: Json | null
          sender_name: string | null
          sent_by: string | null
          status: string
          uazapi_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_name?: string | null
          sent_by?: string | null
          status?: string
          uazapi_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          sender_name?: string | null
          sent_by?: string | null
          status?: string
          uazapi_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_mode: string
          atribuido_em: string | null
          attendance_started: boolean
          broker_id: string | null
          copilot_suggestions_count: number
          created_at: string
          display_name: string | null
          display_name_source: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          last_message_direction: string | null
          last_message_preview: string | null
          last_message_type: string
          lead_id: string | null
          opportunity_score: number | null
          organization_id: string | null
          phone: string
          phone_normalized: string
          reserva_expira_em: string | null
          roleta_modo: string | null
          roleta_vazia_flag: boolean
          source_instance: string | null
          status: string
          temperature: number | null
          unread_count: number
          updated_at: string
        }
        Insert: {
          ai_mode?: string
          atribuido_em?: string | null
          attendance_started?: boolean
          broker_id?: string | null
          copilot_suggestions_count?: number
          created_at?: string
          display_name?: string | null
          display_name_source?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          last_message_direction?: string | null
          last_message_preview?: string | null
          last_message_type?: string
          lead_id?: string | null
          opportunity_score?: number | null
          organization_id?: string | null
          phone: string
          phone_normalized: string
          reserva_expira_em?: string | null
          roleta_modo?: string | null
          roleta_vazia_flag?: boolean
          source_instance?: string | null
          status?: string
          temperature?: number | null
          unread_count?: number
          updated_at?: string
        }
        Update: {
          ai_mode?: string
          atribuido_em?: string | null
          attendance_started?: boolean
          broker_id?: string | null
          copilot_suggestions_count?: number
          created_at?: string
          display_name?: string | null
          display_name_source?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          last_message_direction?: string | null
          last_message_preview?: string | null
          last_message_type?: string
          lead_id?: string | null
          opportunity_score?: number | null
          organization_id?: string | null
          phone?: string
          phone_normalized?: string
          reserva_expira_em?: string | null
          roleta_modo?: string | null
          roleta_vazia_flag?: boolean
          source_instance?: string | null
          status?: string
          temperature?: number | null
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_configs: {
        Row: {
          allow_emojis: boolean
          auto_close_inactive: boolean
          brand_positioning: string | null
          broker_id: string
          commercial_focus: string
          commercial_priority: string
          copilot_mode: string
          created_at: string
          custom_system_prompt: string | null
          followup_enabled: boolean
          followup_max_attempts: number
          followup_period_days: number
          followup_tone: string
          id: string
          incentive_call: boolean
          incentive_visit: boolean
          is_active: boolean
          language_style: string
          max_autonomy: string
          name: string
          objectivity_level: number
          organization_id: string | null
          personality: string
          persuasion_level: number
          property_type: string
          region: string | null
          target_audience: string | null
          updated_at: string
          use_mental_triggers: boolean
        }
        Insert: {
          allow_emojis?: boolean
          auto_close_inactive?: boolean
          brand_positioning?: string | null
          broker_id: string
          commercial_focus?: string
          commercial_priority?: string
          copilot_mode?: string
          created_at?: string
          custom_system_prompt?: string | null
          followup_enabled?: boolean
          followup_max_attempts?: number
          followup_period_days?: number
          followup_tone?: string
          id?: string
          incentive_call?: boolean
          incentive_visit?: boolean
          is_active?: boolean
          language_style?: string
          max_autonomy?: string
          name?: string
          objectivity_level?: number
          organization_id?: string | null
          personality?: string
          persuasion_level?: number
          property_type?: string
          region?: string | null
          target_audience?: string | null
          updated_at?: string
          use_mental_triggers?: boolean
        }
        Update: {
          allow_emojis?: boolean
          auto_close_inactive?: boolean
          brand_positioning?: string | null
          broker_id?: string
          commercial_focus?: string
          commercial_priority?: string
          copilot_mode?: string
          created_at?: string
          custom_system_prompt?: string | null
          followup_enabled?: boolean
          followup_max_attempts?: number
          followup_period_days?: number
          followup_tone?: string
          id?: string
          incentive_call?: boolean
          incentive_visit?: boolean
          is_active?: boolean
          language_style?: string
          max_autonomy?: string
          name?: string
          objectivity_level?: number
          organization_id?: string | null
          personality?: string
          persuasion_level?: number
          property_type?: string
          region?: string | null
          target_audience?: string | null
          updated_at?: string
          use_mental_triggers?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "copilot_configs_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: true
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copilot_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_whatsapp_config: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          instance_token: string
          organization_id: string | null
          phone_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          instance_token: string
          organization_id?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          instance_token?: string
          organization_id?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_whatsapp_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          access_token: string | null
          broker_id: string
          created_at: string
          google_email: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          broker_id: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          broker_id?: string
          created_at?: string
          google_email?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_connections_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: true
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attribution: {
        Row: {
          created_at: string
          id: string
          landing_page: string | null
          lead_id: string | null
          organization_id: string | null
          project_id: string | null
          referrer: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          landing_page?: string | null
          lead_id?: string | null
          organization_id?: string | null
          project_id?: string | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          landing_page?: string | null
          lead_id?: string | null
          organization_id?: string | null
          project_id?: string | null
          referrer?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_attribution_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attribution_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attribution_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_documents: {
        Row: {
          created_at: string
          document_type: string
          id: string
          is_received: boolean
          lead_id: string
          organization_id: string | null
          received_at: string | null
          received_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          is_received?: boolean
          lead_id: string
          organization_id?: string | null
          received_at?: string | null
          received_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          is_received?: boolean
          lead_id?: string
          organization_id?: string | null
          received_at?: string | null
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          broker_id: string | null
          channel: string | null
          created_at: string
          created_by: string | null
          id: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status"] | null
          notes: string | null
          old_status: Database["public"]["Enums"]["lead_status"] | null
          organization_id: string | null
        }
        Insert: {
          broker_id?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          lead_id: string
          new_status?: Database["public"]["Enums"]["lead_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
          organization_id?: string | null
        }
        Update: {
          broker_id?: string | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          lead_id?: string
          new_status?: Database["public"]["Enums"]["lead_status"] | null
          notes?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_whatsapp_labels: {
        Row: {
          applied_via: string
          broker_id: string
          created_at: string
          external_chat_id: string | null
          id: string
          label_id: string
          lead_id: string
          updated_at: string
        }
        Insert: {
          applied_via?: string
          broker_id: string
          created_at?: string
          external_chat_id?: string | null
          id?: string
          label_id: string
          lead_id: string
          updated_at?: string
        }
        Update: {
          applied_via?: string
          broker_id?: string
          created_at?: string
          external_chat_id?: string | null
          id?: string
          label_id?: string
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_whatsapp_labels_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_whatsapp_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_whatsapp_labels_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          atendimento_iniciado_em: string | null
          atribuido_em: string | null
          auto_first_message_at: string | null
          auto_first_message_sent: boolean | null
          broker_id: string | null
          comparecimento: boolean | null
          corretor_atribuido_id: string | null
          cpf: string | null
          created_at: string
          data_agendamento: string | null
          data_envio_proposta: string | null
          data_fechamento: string | null
          data_perda: string | null
          email: string | null
          etapa_perda: string | null
          id: string
          inactivated_at: string | null
          inactivated_by: string | null
          inactivation_reason: string | null
          last_interaction_at: string | null
          lead_origin: string | null
          lead_origin_detail: string | null
          motivo_atribuicao: string | null
          name: string
          notes: string | null
          organization_id: string | null
          project_id: string | null
          registered_at: string | null
          registered_by: string | null
          reserva_expira_em: string | null
          roleta_id: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          status_distribuicao:
            | Database["public"]["Enums"]["distribution_status"]
            | null
          tipo_agendamento: string | null
          updated_at: string
          valor_final_venda: number | null
          valor_proposta: number | null
          whatsapp: string
        }
        Insert: {
          atendimento_iniciado_em?: string | null
          atribuido_em?: string | null
          auto_first_message_at?: string | null
          auto_first_message_sent?: boolean | null
          broker_id?: string | null
          comparecimento?: boolean | null
          corretor_atribuido_id?: string | null
          cpf?: string | null
          created_at?: string
          data_agendamento?: string | null
          data_envio_proposta?: string | null
          data_fechamento?: string | null
          data_perda?: string | null
          email?: string | null
          etapa_perda?: string | null
          id?: string
          inactivated_at?: string | null
          inactivated_by?: string | null
          inactivation_reason?: string | null
          last_interaction_at?: string | null
          lead_origin?: string | null
          lead_origin_detail?: string | null
          motivo_atribuicao?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          registered_at?: string | null
          registered_by?: string | null
          reserva_expira_em?: string | null
          roleta_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          status_distribuicao?:
            | Database["public"]["Enums"]["distribution_status"]
            | null
          tipo_agendamento?: string | null
          updated_at?: string
          valor_final_venda?: number | null
          valor_proposta?: number | null
          whatsapp: string
        }
        Update: {
          atendimento_iniciado_em?: string | null
          atribuido_em?: string | null
          auto_first_message_at?: string | null
          auto_first_message_sent?: boolean | null
          broker_id?: string | null
          comparecimento?: boolean | null
          corretor_atribuido_id?: string | null
          cpf?: string | null
          created_at?: string
          data_agendamento?: string | null
          data_envio_proposta?: string | null
          data_fechamento?: string | null
          data_perda?: string | null
          email?: string | null
          etapa_perda?: string | null
          id?: string
          inactivated_at?: string | null
          inactivated_by?: string | null
          inactivation_reason?: string | null
          last_interaction_at?: string | null
          lead_origin?: string | null
          lead_origin_detail?: string | null
          motivo_atribuicao?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          registered_at?: string | null
          registered_by?: string | null
          reserva_expira_em?: string | null
          roleta_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          status_distribuicao?:
            | Database["public"]["Enums"]["distribution_status"]
            | null
          tipo_agendamento?: string | null
          updated_at?: string
          valor_final_venda?: number | null
          valor_proposta?: number | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_corretor_atribuido_id_fkey"
            columns: ["corretor_atribuido_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_roleta_id_fkey"
            columns: ["roleta_id"]
            isOneToOne: false
            referencedRelation: "roletas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          lead_id: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lead_id?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_feature_overrides: {
        Row: {
          created_at: string
          expires_at: string | null
          feature_key: string
          feature_value: string
          granted_by: string | null
          id: string
          organization_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature_key: string
          feature_value: string
          granted_by?: string | null
          id?: string
          organization_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature_key?: string
          feature_value?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_feature_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          full_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          joined_at: string
          organization_id: string
          rejection_reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          organization_id: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          organization_id?: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          external_subscription_id: string | null
          id: string
          metadata: Json
          organization_id: string
          plan_id: string
          started_at: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          external_subscription_id?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          plan_id: string
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          external_subscription_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          plan_id?: string
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cnpj: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string | null
          favicon_url: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          metadata: Json
          name: string
          primary_color: string | null
          rejection_reason: string | null
          requested_by_user_id: string | null
          secondary_color: string | null
          slug: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          favicon_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json
          name: string
          primary_color?: string | null
          rejection_reason?: string | null
          requested_by_user_id?: string | null
          secondary_color?: string | null
          slug: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          favicon_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string
          primary_color?: string | null
          rejection_reason?: string | null
          requested_by_user_id?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          project_id: string | null
          referrer: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          project_id?: string | null
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          project_id?: string | null
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          feature_type: string
          feature_value: string
          id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          feature_type?: string
          feature_value: string
          id?: string
          plan_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          feature_type?: string
          feature_value?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_period: string
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_period?: string
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_prompt: string | null
          city: string
          city_slug: string | null
          created_at: string
          created_by_broker_id: string | null
          description: string | null
          features: Json | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_active: boolean
          landing_content: Json | null
          name: string
          organization_id: string | null
          slug: string
          status: string
          type: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          ai_prompt?: string | null
          city: string
          city_slug?: string | null
          created_at?: string
          created_by_broker_id?: string | null
          description?: string | null
          features?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean
          landing_content?: Json | null
          name: string
          organization_id?: string | null
          slug: string
          status?: string
          type?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          ai_prompt?: string | null
          city?: string
          city_slug?: string | null
          created_at?: string
          created_by_broker_id?: string | null
          description?: string | null
          features?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_active?: boolean
          landing_content?: Json | null
          name?: string
          organization_id?: string | null
          slug?: string
          status?: string
          type?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_broker_id_fkey"
            columns: ["created_by_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_parcelas: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          indice_correcao: string | null
          observacao: string | null
          ordem: number | null
          proposta_id: string
          quantidade_parcelas: number | null
          tipo: string
          valor: number
          valor_parcela: number | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          indice_correcao?: string | null
          observacao?: string | null
          ordem?: number | null
          proposta_id: string
          quantidade_parcelas?: number | null
          tipo?: string
          valor: number
          valor_parcela?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          indice_correcao?: string | null
          observacao?: string | null
          ordem?: number | null
          proposta_id?: string
          quantidade_parcelas?: number | null
          tipo?: string
          valor?: number
          valor_parcela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_parcelas_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          aprovada_em: string | null
          broker_id: string | null
          condicoes_especiais: string | null
          created_at: string | null
          created_by: string | null
          descricao_permuta: string | null
          enviada_vendedor_em: string | null
          forma_pagamento_entrada: string | null
          id: string
          lead_id: string
          motivo_rejeicao: string | null
          observacoes_corretor: string | null
          organization_id: string | null
          parcelamento: string | null
          permuta: boolean | null
          project_id: string | null
          rejeitada_em: string | null
          status_proposta: string | null
          unidade: string | null
          updated_at: string | null
          valor_entrada: number | null
          valor_proposta: number
        }
        Insert: {
          aprovada_em?: string | null
          broker_id?: string | null
          condicoes_especiais?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao_permuta?: string | null
          enviada_vendedor_em?: string | null
          forma_pagamento_entrada?: string | null
          id?: string
          lead_id: string
          motivo_rejeicao?: string | null
          observacoes_corretor?: string | null
          organization_id?: string | null
          parcelamento?: string | null
          permuta?: boolean | null
          project_id?: string | null
          rejeitada_em?: string | null
          status_proposta?: string | null
          unidade?: string | null
          updated_at?: string | null
          valor_entrada?: number | null
          valor_proposta: number
        }
        Update: {
          aprovada_em?: string | null
          broker_id?: string | null
          condicoes_especiais?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao_permuta?: string | null
          enviada_vendedor_em?: string | null
          forma_pagamento_entrada?: string | null
          id?: string
          lead_id?: string
          motivo_rejeicao?: string | null
          observacoes_corretor?: string | null
          organization_id?: string | null
          parcelamento?: string | null
          permuta?: boolean | null
          project_id?: string | null
          rejeitada_em?: string | null
          status_proposta?: string | null
          unidade?: string | null
          updated_at?: string | null
          valor_entrada?: number | null
          valor_proposta?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      roletas: {
        Row: {
          ativa: boolean
          auto_checkout_enabled: boolean
          auto_checkout_horario: string
          created_at: string
          escopo_empreendimentos: string
          id: string
          lider_id: string | null
          modo_distribuicao: string
          nome: string
          organization_id: string | null
          tempo_reserva_minutos: number
          timeout_ativo: boolean
          timeout_pausa_fim: string
          timeout_pausa_inicio: string
          tipo_origem: string
          ultimo_membro_ordem_atribuida: number
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          auto_checkout_enabled?: boolean
          auto_checkout_horario?: string
          created_at?: string
          escopo_empreendimentos?: string
          id?: string
          lider_id?: string | null
          modo_distribuicao?: string
          nome: string
          organization_id?: string | null
          tempo_reserva_minutos?: number
          timeout_ativo?: boolean
          timeout_pausa_fim?: string
          timeout_pausa_inicio?: string
          tipo_origem?: string
          ultimo_membro_ordem_atribuida?: number
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          auto_checkout_enabled?: boolean
          auto_checkout_horario?: string
          created_at?: string
          escopo_empreendimentos?: string
          id?: string
          lider_id?: string | null
          modo_distribuicao?: string
          nome?: string
          organization_id?: string | null
          tempo_reserva_minutos?: number
          timeout_ativo?: boolean
          timeout_pausa_fim?: string
          timeout_pausa_inicio?: string
          tipo_origem?: string
          ultimo_membro_ordem_atribuida?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roletas_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roletas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roletas_empreendimentos: {
        Row: {
          ativo: boolean
          created_at: string
          empreendimento_id: string
          id: string
          roleta_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empreendimento_id: string
          id?: string
          roleta_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empreendimento_id?: string
          id?: string
          roleta_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roletas_empreendimentos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roletas_empreendimentos_roleta_id_fkey"
            columns: ["roleta_id"]
            isOneToOne: false
            referencedRelation: "roletas"
            referencedColumns: ["id"]
          },
        ]
      }
      roletas_log: {
        Row: {
          acao: string
          created_at: string
          de_corretor_id: string | null
          executado_por_user_id: string | null
          id: string
          lead_id: string | null
          motivo: string | null
          para_corretor_id: string | null
          roleta_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          de_corretor_id?: string | null
          executado_por_user_id?: string | null
          id?: string
          lead_id?: string | null
          motivo?: string | null
          para_corretor_id?: string | null
          roleta_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          de_corretor_id?: string | null
          executado_por_user_id?: string | null
          id?: string
          lead_id?: string | null
          motivo?: string | null
          para_corretor_id?: string | null
          roleta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roletas_log_de_corretor_id_fkey"
            columns: ["de_corretor_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roletas_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roletas_log_para_corretor_id_fkey"
            columns: ["para_corretor_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roletas_log_roleta_id_fkey"
            columns: ["roleta_id"]
            isOneToOne: false
            referencedRelation: "roletas"
            referencedColumns: ["id"]
          },
        ]
      }
      roletas_membros: {
        Row: {
          ativo: boolean
          checkin_em: string | null
          checkout_em: string | null
          corretor_id: string
          created_at: string
          id: string
          ordem: number
          roleta_id: string
          status_checkin: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          checkin_em?: string | null
          checkout_em?: string | null
          corretor_id: string
          created_at?: string
          id?: string
          ordem: number
          roleta_id: string
          status_checkin?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          checkin_em?: string | null
          checkout_em?: string | null
          corretor_id?: string
          created_at?: string
          id?: string
          ordem?: number
          roleta_id?: string
          status_checkin?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roletas_membros_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roletas_membros_roleta_id_fkey"
            columns: ["roleta_id"]
            isOneToOne: false
            referencedRelation: "roletas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          broker_id: string
          completed_at: string | null
          created_at: string | null
          custom_message: string | null
          failed_count: number | null
          id: string
          lead_id: string | null
          lead_previous_status: string | null
          name: string
          organization_id: string | null
          project_id: string | null
          reply_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          target_status: string[] | null
          template_id: string | null
          total_leads: number | null
          updated_at: string | null
        }
        Insert: {
          broker_id: string
          completed_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          failed_count?: number | null
          id?: string
          lead_id?: string | null
          lead_previous_status?: string | null
          name: string
          organization_id?: string | null
          project_id?: string | null
          reply_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          target_status?: string[] | null
          template_id?: string | null
          total_leads?: number | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string
          completed_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          failed_count?: number | null
          id?: string
          lead_id?: string | null
          lead_previous_status?: string | null
          name?: string
          organization_id?: string | null
          project_id?: string | null
          reply_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          target_status?: string[] | null
          template_id?: string | null
          total_leads?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_daily_stats: {
        Row: {
          broker_id: string
          date: string
          error_count: number | null
          failed_count: number | null
          id: string
          optout_count: number | null
          reply_count: number | null
          sent_count: number | null
        }
        Insert: {
          broker_id: string
          date: string
          error_count?: number | null
          failed_count?: number | null
          id?: string
          optout_count?: number | null
          reply_count?: number | null
          sent_count?: number | null
        }
        Update: {
          broker_id?: string
          date?: string
          error_count?: number | null
          failed_count?: number | null
          id?: string
          optout_count?: number | null
          reply_count?: number | null
          sent_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_daily_stats_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_labels: {
        Row: {
          broker_id: string
          color: string | null
          created_at: string
          external_id: string | null
          id: string
          last_synced_at: string | null
          name: string
          organization_id: string | null
          source: string
          updated_at: string
        }
        Insert: {
          broker_id: string
          color?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          organization_id?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          broker_id?: string
          color?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          organization_id?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_labels_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_labels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_lead_replies: {
        Row: {
          campaign_id: string
          phone: string
          replied_at: string
        }
        Insert: {
          campaign_id: string
          phone: string
          replied_at?: string
        }
        Update: {
          campaign_id?: string
          phone?: string
          replied_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_lead_replies_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_queue: {
        Row: {
          attempts: number | null
          broker_id: string
          campaign_id: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          max_attempts: number | null
          message: string
          organization_id: string | null
          pause_reason: string | null
          phone: string
          scheduled_at: string
          sent_at: string | null
          source_instance: string
          status: string | null
          step_number: number | null
          uazapi_message_id: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          broker_id: string
          campaign_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          max_attempts?: number | null
          message: string
          organization_id?: string | null
          pause_reason?: string | null
          phone: string
          scheduled_at: string
          sent_at?: string | null
          source_instance?: string
          status?: string | null
          step_number?: number | null
          uazapi_message_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          broker_id?: string
          campaign_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          max_attempts?: number | null
          message?: string
          organization_id?: string | null
          pause_reason?: string | null
          phone?: string
          scheduled_at?: string
          sent_at?: string | null
          source_instance?: string
          status?: string | null
          step_number?: number | null
          uazapi_message_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_queue_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_templates: {
        Row: {
          broker_id: string | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_templates_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_optouts: {
        Row: {
          created_at: string | null
          detected_keyword: string | null
          id: string
          phone: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          detected_keyword?: string | null
          id?: string
          phone: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          detected_keyword?: string | null
          id?: string
          phone?: string
          reason?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_organization_limit: {
        Args: { _feature_key: string; _org_id: string }
        Returns: Json
      }
      claim_disputed_lead: { Args: { _lead_id: string }; Returns: Json }
      get_my_broker_id: { Args: never; Returns: string }
      get_my_roleta_ids: { Args: never; Returns: string[] }
      get_organization_members_with_users: {
        Args: { _org_id: string }
        Returns: {
          approval_status: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          joined_at: string
          organization_id: string
          role: string
          user_id: string
          whatsapp: string
        }[]
      }
      get_user_organization_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_users_emails: {
        Args: { _user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_leader: { Args: { _user_id: string }; Returns: boolean }
      increment_copilot_count: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      transfer_lead: {
        Args: { _lead_id: string; _new_broker_id: string }
        Returns: undefined
      }
      unify_lead: { Args: { _new_lead_id: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "broker"
        | "leader"
        | "super_admin"
        | "owner"
        | "manager"
      distribution_status:
        | "atribuicao_inicial"
        | "reassinado_timeout"
        | "fallback_lider"
        | "atendimento_iniciado"
        | "em_disputa"
      interaction_type:
        | "status_change"
        | "note_added"
        | "document_request"
        | "document_received"
        | "info_sent"
        | "contact_attempt"
        | "registration"
        | "origin_change"
        | "inactivation"
        | "notification"
        | "roleta_atribuicao"
        | "roleta_timeout"
        | "roleta_fallback"
        | "roleta_transferencia"
        | "atendimento_iniciado"
        | "agendamento_registrado"
        | "comparecimento_registrado"
        | "proposta_enviada"
        | "venda_confirmada"
        | "reagendamento"
        | "whatsapp_manual"
        | "reactivation"
        | "ligacao"
        | "lead_unificado"
      lead_status:
        | "new"
        | "info_sent"
        | "awaiting_docs"
        | "scheduling"
        | "docs_received"
        | "registered"
        | "inactive"
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
      app_role: [
        "admin",
        "broker",
        "leader",
        "super_admin",
        "owner",
        "manager",
      ],
      distribution_status: [
        "atribuicao_inicial",
        "reassinado_timeout",
        "fallback_lider",
        "atendimento_iniciado",
        "em_disputa",
      ],
      interaction_type: [
        "status_change",
        "note_added",
        "document_request",
        "document_received",
        "info_sent",
        "contact_attempt",
        "registration",
        "origin_change",
        "inactivation",
        "notification",
        "roleta_atribuicao",
        "roleta_timeout",
        "roleta_fallback",
        "roleta_transferencia",
        "atendimento_iniciado",
        "agendamento_registrado",
        "comparecimento_registrado",
        "proposta_enviada",
        "venda_confirmada",
        "reagendamento",
        "whatsapp_manual",
        "reactivation",
        "ligacao",
        "lead_unificado",
      ],
      lead_status: [
        "new",
        "info_sent",
        "awaiting_docs",
        "scheduling",
        "docs_received",
        "registered",
        "inactive",
      ],
    },
  },
} as const
