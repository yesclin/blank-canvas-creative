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
      access_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_records: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          data: Json
          edit_window_until: string | null
          id: string
          locked_at: string | null
          patient_id: string
          professional_id: string
          responses: Json | null
          saved_at: string | null
          signed_at: string | null
          signed_by: string | null
          specialty_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          structure_snapshot: Json | null
          template_id: string | null
          template_version_id: string | null
          updated_at: string
          validation_code: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          edit_window_until?: string | null
          id?: string
          locked_at?: string | null
          patient_id: string
          professional_id: string
          responses?: Json | null
          saved_at?: string | null
          signed_at?: string | null
          signed_by?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          structure_snapshot?: Json | null
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
          validation_code?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          edit_window_until?: string | null
          id?: string
          locked_at?: string | null
          patient_id?: string
          professional_id?: string
          responses?: Json | null
          saved_at?: string | null
          signed_at?: string | null
          signed_by?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          structure_snapshot?: Json | null
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
          validation_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_records_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_records_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          fields: Json
          id: string
          structure: Json
          template_id: string
          version: number
          version_number: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fields?: Json
          id?: string
          structure?: Json
          template_id: string
          version?: number
          version_number?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fields?: Json
          id?: string
          structure?: Json
          template_id?: string
          version?: number
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_templates: {
        Row: {
          archived: boolean
          campos: Json
          clinic_id: string
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          fields: Json
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_system: boolean
          name: string
          procedure_id: string | null
          specialty: string | null
          specialty_id: string | null
          template_type: string | null
          updated_at: string
          usage_count: number
          version: number
        }
        Insert: {
          archived?: boolean
          campos?: Json
          clinic_id: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name: string
          procedure_id?: string | null
          specialty?: string | null
          specialty_id?: string | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number
          version?: number
        }
        Update: {
          archived?: boolean
          campos?: Json
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name?: string
          procedure_id?: string | null
          specialty?: string | null
          specialty_id?: string | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_templates_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_events: {
        Row: {
          appointment_id: string
          clinic_id: string
          created_at: string
          event_type: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_by: string | null
        }
        Insert: {
          appointment_id: string
          clinic_id: string
          created_at?: string
          event_type: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
        }
        Update: {
          appointment_id?: string
          clinic_id?: string
          created_at?: string
          event_type?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_payments: {
        Row: {
          appointment_id: string
          authorization_code: string | null
          clinic_id: string
          created_at: string
          due_date: string | null
          finance_transaction_id: string | null
          id: string
          installment_number: number
          installments: number
          notes: string | null
          patient_id: string
          payment_method_id: string
          professional_id: string | null
          received_amount: number
          received_at: string
          received_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          authorization_code?: string | null
          clinic_id: string
          created_at?: string
          due_date?: string | null
          finance_transaction_id?: string | null
          id?: string
          installment_number?: number
          installments?: number
          notes?: string | null
          patient_id: string
          payment_method_id: string
          professional_id?: string | null
          received_amount: number
          received_at?: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          authorization_code?: string | null
          clinic_id?: string
          created_at?: string
          due_date?: string | null
          finance_transaction_id?: string | null
          id?: string
          installment_number?: number
          installments?: number
          notes?: string | null
          patient_id?: string
          payment_method_id?: string
          professional_id?: string | null
          received_amount?: number
          received_at?: string
          received_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_finance_transaction_id_fkey"
            columns: ["finance_transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_rules: {
        Row: {
          clinic_id: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          rule_type: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_sessions: {
        Row: {
          appointment_id: string
          clinic_id: string
          created_at: string
          current_pause_started_at: string | null
          id: string
          is_paused: boolean
          patient_id: string
          pause_events: Json
          professional_id: string
          session_notes: string | null
          session_summary: Json | null
          total_paused_seconds: number
          updated_at: string
        }
        Insert: {
          appointment_id: string
          clinic_id: string
          created_at?: string
          current_pause_started_at?: string | null
          id?: string
          is_paused?: boolean
          patient_id: string
          pause_events?: Json
          professional_id: string
          session_notes?: string | null
          session_summary?: Json | null
          total_paused_seconds?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          clinic_id?: string
          created_at?: string
          current_pause_started_at?: string | null
          id?: string
          is_paused?: boolean
          patient_id?: string
          pause_events?: Json
          professional_id?: string
          session_notes?: string | null
          session_summary?: Json | null
          total_paused_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_statuses: {
        Row: {
          clinic_id: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          clinic_id: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          clinic_id?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_statuses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          clinic_id: string
          color: string | null
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_types_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          amount_due: number | null
          amount_expected: number | null
          amount_received: number | null
          appointment_type: string
          arrived_at: string | null
          booking_reference: string | null
          booking_source: string | null
          cancellation_reason: string | null
          care_mode: string
          clinic_id: string
          confirmation_token: string | null
          consent_telehealth_accepted: boolean
          consent_telehealth_accepted_at: string | null
          consent_telehealth_required: boolean
          created_at: string
          created_by: string | null
          created_source: string
          duration_minutes: number
          end_time: string
          expected_value: number | null
          finished_at: string | null
          has_pending_payment: boolean
          id: string
          insurance_id: string | null
          is_first_visit: boolean
          is_fit_in: boolean
          is_return: boolean
          meeting_created_at: string | null
          meeting_ended_at: string | null
          meeting_id: string | null
          meeting_link: string | null
          meeting_password: string | null
          meeting_provider: string | null
          meeting_started_at: string | null
          meeting_status: string
          notes: string | null
          patient_id: string
          patient_snapshot_name: string | null
          patient_snapshot_phone: string | null
          paused_at: string | null
          payment_method_id: string | null
          payment_status: string
          payment_type: string | null
          precheck_status: string
          procedure_cost: number | null
          procedure_id: string | null
          professional_id: string
          room_id: string | null
          scheduled_date: string
          specialty_id: string | null
          start_time: string
          started_at: string | null
          status: string
          technical_issue_count: number
          teleconsultation_notes: string | null
          updated_at: string
        }
        Insert: {
          amount_due?: number | null
          amount_expected?: number | null
          amount_received?: number | null
          appointment_type?: string
          arrived_at?: string | null
          booking_reference?: string | null
          booking_source?: string | null
          cancellation_reason?: string | null
          care_mode?: string
          clinic_id: string
          confirmation_token?: string | null
          consent_telehealth_accepted?: boolean
          consent_telehealth_accepted_at?: string | null
          consent_telehealth_required?: boolean
          created_at?: string
          created_by?: string | null
          created_source?: string
          duration_minutes?: number
          end_time: string
          expected_value?: number | null
          finished_at?: string | null
          has_pending_payment?: boolean
          id?: string
          insurance_id?: string | null
          is_first_visit?: boolean
          is_fit_in?: boolean
          is_return?: boolean
          meeting_created_at?: string | null
          meeting_ended_at?: string | null
          meeting_id?: string | null
          meeting_link?: string | null
          meeting_password?: string | null
          meeting_provider?: string | null
          meeting_started_at?: string | null
          meeting_status?: string
          notes?: string | null
          patient_id: string
          patient_snapshot_name?: string | null
          patient_snapshot_phone?: string | null
          paused_at?: string | null
          payment_method_id?: string | null
          payment_status?: string
          payment_type?: string | null
          precheck_status?: string
          procedure_cost?: number | null
          procedure_id?: string | null
          professional_id: string
          room_id?: string | null
          scheduled_date: string
          specialty_id?: string | null
          start_time: string
          started_at?: string | null
          status?: string
          technical_issue_count?: number
          teleconsultation_notes?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number | null
          amount_expected?: number | null
          amount_received?: number | null
          appointment_type?: string
          arrived_at?: string | null
          booking_reference?: string | null
          booking_source?: string | null
          cancellation_reason?: string | null
          care_mode?: string
          clinic_id?: string
          confirmation_token?: string | null
          consent_telehealth_accepted?: boolean
          consent_telehealth_accepted_at?: string | null
          consent_telehealth_required?: boolean
          created_at?: string
          created_by?: string | null
          created_source?: string
          duration_minutes?: number
          end_time?: string
          expected_value?: number | null
          finished_at?: string | null
          has_pending_payment?: boolean
          id?: string
          insurance_id?: string | null
          is_first_visit?: boolean
          is_fit_in?: boolean
          is_return?: boolean
          meeting_created_at?: string | null
          meeting_ended_at?: string | null
          meeting_id?: string | null
          meeting_link?: string | null
          meeting_password?: string | null
          meeting_provider?: string | null
          meeting_started_at?: string | null
          meeting_status?: string
          notes?: string | null
          patient_id?: string
          patient_snapshot_name?: string | null
          patient_snapshot_phone?: string | null
          paused_at?: string | null
          payment_method_id?: string | null
          payment_status?: string
          payment_type?: string | null
          precheck_status?: string
          procedure_cost?: number | null
          procedure_id?: string | null
          professional_id?: string
          room_id?: string | null
          scheduled_date?: string
          specialty_id?: string | null
          start_time?: string
          started_at?: string | null
          status?: string
          technical_issue_count?: number
          teleconsultation_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          channel: string | null
          clinic_id: string
          conditions: Json | null
          created_at: string
          created_by: string | null
          delay_type: string | null
          delay_value: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number | null
          template_id: string | null
          trigger_config: Json | null
          trigger_event: string
          trigger_type: string | null
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          channel?: string | null
          clinic_id: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          delay_type?: string | null
          delay_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          template_id?: string | null
          trigger_config?: Json | null
          trigger_event: string
          trigger_type?: string | null
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          channel?: string | null
          clinic_id?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          delay_type?: string | null
          delay_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          template_id?: string | null
          trigger_config?: Json | null
          trigger_event?: string
          trigger_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      before_after_records: {
        Row: {
          after_media_id: string | null
          before_media_id: string | null
          category: string | null
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          procedure_date: string | null
          professional_id: string | null
        }
        Insert: {
          after_media_id?: string | null
          before_media_id?: string | null
          category?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          procedure_date?: string | null
          professional_id?: string | null
        }
        Update: {
          after_media_id?: string | null
          before_media_id?: string | null
          category?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_date?: string | null
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "before_after_records_after_media_id_fkey"
            columns: ["after_media_id"]
            isOneToOne: false
            referencedRelation: "clinical_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "before_after_records_before_media_id_fkey"
            columns: ["before_media_id"]
            isOneToOne: false
            referencedRelation: "clinical_media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "before_after_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "before_after_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "before_after_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json
          id: string
          measurement_type: string
          patient_id: string
          professional_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json
          id?: string
          measurement_type: string
          patient_id: string
          professional_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json
          id?: string
          measurement_type?: string
          patient_id?: string
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_measurements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_channel_integrations: {
        Row: {
          access_token: string | null
          api_url: string | null
          base_url: string | null
          business_account_id: string | null
          channel: string
          clinic_id: string
          config: Json
          created_at: string
          display_phone_number: string | null
          id: string
          instance_id: string | null
          is_active: boolean
          metadata: Json | null
          phone_number_id: string | null
          provider: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          api_url?: string | null
          base_url?: string | null
          business_account_id?: string | null
          channel: string
          clinic_id: string
          config?: Json
          created_at?: string
          display_phone_number?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean
          metadata?: Json | null
          phone_number_id?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          api_url?: string | null
          base_url?: string | null
          business_account_id?: string | null
          channel?: string
          clinic_id?: string
          config?: Json
          created_at?: string
          display_phone_number?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean
          metadata?: Json | null
          phone_number_id?: string | null
          provider?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_channel_integrations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_document_counter: {
        Row: {
          clinic_id: string
          created_at: string
          current_number: number
          document_type: string
          id: string
          prefix: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          current_number?: number
          document_type: string
          id?: string
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          current_number?: number
          document_type?: string
          id?: string
          prefix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_document_counter_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_document_settings: {
        Row: {
          clinic_id: string
          clinic_name: string | null
          created_at: string
          custom_css: string | null
          doc_type_config: Json | null
          document_type: string
          font_family: string | null
          footer_text: string | null
          header_layout: string | null
          header_style: string | null
          header_text: string | null
          id: string
          logo_position: string | null
          logo_url: string | null
          primary_color: string | null
          responsible_crm: string | null
          responsible_name: string | null
          secondary_color: string | null
          show_clinic_info: boolean
          show_crm: boolean | null
          show_digital_signature: boolean | null
          show_footer: boolean | null
          show_professional_info: boolean
          signature_image_url: string | null
          updated_at: string
          use_professional_from_doc: boolean | null
          watermark_text: string | null
          watermark_type: string | null
        }
        Insert: {
          clinic_id: string
          clinic_name?: string | null
          created_at?: string
          custom_css?: string | null
          doc_type_config?: Json | null
          document_type: string
          font_family?: string | null
          footer_text?: string | null
          header_layout?: string | null
          header_style?: string | null
          header_text?: string | null
          id?: string
          logo_position?: string | null
          logo_url?: string | null
          primary_color?: string | null
          responsible_crm?: string | null
          responsible_name?: string | null
          secondary_color?: string | null
          show_clinic_info?: boolean
          show_crm?: boolean | null
          show_digital_signature?: boolean | null
          show_footer?: boolean | null
          show_professional_info?: boolean
          signature_image_url?: string | null
          updated_at?: string
          use_professional_from_doc?: boolean | null
          watermark_text?: string | null
          watermark_type?: string | null
        }
        Update: {
          clinic_id?: string
          clinic_name?: string | null
          created_at?: string
          custom_css?: string | null
          doc_type_config?: Json | null
          document_type?: string
          font_family?: string | null
          footer_text?: string | null
          header_layout?: string | null
          header_style?: string | null
          header_text?: string | null
          id?: string
          logo_position?: string | null
          logo_url?: string | null
          primary_color?: string | null
          responsible_crm?: string | null
          responsible_name?: string | null
          secondary_color?: string | null
          show_clinic_info?: boolean
          show_crm?: boolean | null
          show_digital_signature?: boolean | null
          show_footer?: boolean | null
          show_professional_info?: boolean
          signature_image_url?: string | null
          updated_at?: string
          use_professional_from_doc?: boolean | null
          watermark_text?: string | null
          watermark_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_document_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_schedule_config: {
        Row: {
          clinic_id: string
          created_at: string
          default_duration_minutes: number
          end_time: string
          id: string
          start_time: string
          updated_at: string
          working_days: Json
        }
        Insert: {
          clinic_id: string
          created_at?: string
          default_duration_minutes?: number
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          working_days?: Json
        }
        Update: {
          clinic_id?: string
          created_at?: string
          default_duration_minutes?: number
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          working_days?: Json
        }
        Relationships: [
          {
            foreignKeyName: "clinic_schedule_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_specialty_modules: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_enabled: boolean
          module_key: string
          specialty_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_key: string
          specialty_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_key?: string
          specialty_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_specialty_modules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_specialty_modules_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_teleconsultation_settings: {
        Row: {
          allow_join_with_failed_precheck: boolean
          allow_precheck_file_upload: boolean
          allow_recording: boolean
          clinic_id: string
          created_at: string
          default_provider: string | null
          enabled: boolean
          id: string
          late_tolerance_minutes: number
          post_call_message: string | null
          precheck_window_minutes_before: number
          require_precheck: boolean
          require_telehealth_consent: boolean
          room_join_window_minutes_before: number
          updated_at: string
          waiting_room_message: string | null
        }
        Insert: {
          allow_join_with_failed_precheck?: boolean
          allow_precheck_file_upload?: boolean
          allow_recording?: boolean
          clinic_id: string
          created_at?: string
          default_provider?: string | null
          enabled?: boolean
          id?: string
          late_tolerance_minutes?: number
          post_call_message?: string | null
          precheck_window_minutes_before?: number
          require_precheck?: boolean
          require_telehealth_consent?: boolean
          room_join_window_minutes_before?: number
          updated_at?: string
          waiting_room_message?: string | null
        }
        Update: {
          allow_join_with_failed_precheck?: boolean
          allow_precheck_file_upload?: boolean
          allow_recording?: boolean
          clinic_id?: string
          created_at?: string
          default_provider?: string | null
          enabled?: boolean
          id?: string
          late_tolerance_minutes?: number
          post_call_message?: string | null
          precheck_window_minutes_before?: number
          require_precheck?: boolean
          require_telehealth_consent?: boolean
          room_join_window_minutes_before?: number
          updated_at?: string
          waiting_room_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_teleconsultation_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_addendums: {
        Row: {
          clinic_id: string
          content: string
          created_at: string
          id: string
          module_origin: string | null
          patient_id: string
          professional_id: string
          reason: string | null
          record_id: string
          record_type: string
          specialty_id: string | null
        }
        Insert: {
          clinic_id: string
          content: string
          created_at?: string
          id?: string
          module_origin?: string | null
          patient_id: string
          professional_id: string
          reason?: string | null
          record_id: string
          record_type: string
          specialty_id?: string | null
        }
        Update: {
          clinic_id?: string
          content?: string
          created_at?: string
          id?: string
          module_origin?: string | null
          patient_id?: string
          professional_id?: string
          reason?: string | null
          record_id?: string
          record_type?: string
          specialty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_addendums_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_addendums_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_addendums_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_addendums_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_alerts: {
        Row: {
          alert_type: string
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          patient_id: string
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          alert_type?: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          patient_id: string
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          patient_id?: string
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_documents: {
        Row: {
          clinic_id: string
          content: Json
          created_at: string
          created_by: string | null
          document_hash: string | null
          document_reference: string | null
          document_type: string
          id: string
          is_revoked: boolean | null
          patient_id: string
          patient_name: string | null
          pdf_url: string | null
          professional_id: string
          professional_name: string | null
          replaced_by_document_id: string | null
          replaces_document_id: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          signed_at: string | null
          signed_by: string | null
          source_record_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          validation_code: string | null
        }
        Insert: {
          clinic_id: string
          content?: Json
          created_at?: string
          created_by?: string | null
          document_hash?: string | null
          document_reference?: string | null
          document_type: string
          id?: string
          is_revoked?: boolean | null
          patient_id: string
          patient_name?: string | null
          pdf_url?: string | null
          professional_id: string
          professional_name?: string | null
          replaced_by_document_id?: string | null
          replaces_document_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          signed_at?: string | null
          signed_by?: string | null
          source_record_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          validation_code?: string | null
        }
        Update: {
          clinic_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          document_hash?: string | null
          document_reference?: string | null
          document_type?: string
          id?: string
          is_revoked?: boolean | null
          patient_id?: string
          patient_name?: string | null
          pdf_url?: string | null
          professional_id?: string
          professional_name?: string | null
          replaced_by_document_id?: string | null
          replaces_document_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          signed_at?: string | null
          signed_by?: string | null
          source_record_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          validation_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_replaced_by_document_id_fkey"
            columns: ["replaced_by_document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_replaces_document_id_fkey"
            columns: ["replaces_document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_evolutions: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          content: Json
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          professional_id: string
          signed_at: string | null
          signed_by: string | null
          specialty_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          content?: Json
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          professional_id: string
          signed_at?: string | null
          signed_by?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          content?: Json
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string
          signed_at?: string | null
          signed_by?: string | null
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_evolutions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_evolutions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_evolutions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_evolutions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_evolutions_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_media: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          patient_id: string
          professional_id: string | null
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          patient_id: string
          professional_id?: string | null
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_media_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_media_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_media_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_modules: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          name?: string
        }
        Relationships: []
      }
      clinical_scales: {
        Row: {
          clinic_id: string | null
          created_at: string
          description: string | null
          id: string
          interpretation_guide: Json | null
          is_active: boolean
          is_system: boolean
          max_value: number | null
          min_value: number | null
          name: string
          options: Json | null
          scale_type: string
          unit: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interpretation_guide?: Json | null
          is_active?: boolean
          is_system?: boolean
          max_value?: number | null
          min_value?: number | null
          name: string
          options?: Json | null
          scale_type?: string
          unit?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interpretation_guide?: Json | null
          is_active?: boolean
          is_system?: boolean
          max_value?: number | null
          min_value?: number | null
          name?: string
          options?: Json | null
          scale_type?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_scales_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          allow_negative_stock: boolean | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string | null
          fiscal_type: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo_url: string | null
          margin_alert_enabled: boolean | null
          margin_alert_min_percent: number | null
          margin_alert_period_days: number | null
          monthly_goal: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          primary_specialty_id: string | null
          public_booking_enabled: boolean
          public_booking_settings: Json
          slug: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allow_negative_stock?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          fiscal_type?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          margin_alert_enabled?: boolean | null
          margin_alert_min_percent?: number | null
          margin_alert_period_days?: number | null
          monthly_goal?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          primary_specialty_id?: string | null
          public_booking_enabled?: boolean
          public_booking_settings?: Json
          slug?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allow_negative_stock?: boolean | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          fiscal_type?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          margin_alert_enabled?: boolean | null
          margin_alert_min_percent?: number | null
          margin_alert_period_days?: number | null
          monthly_goal?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          primary_specialty_id?: string | null
          public_booking_enabled?: boolean
          public_booking_settings?: Json
          slug?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_primary_specialty_fk"
            columns: ["primary_specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_terms: {
        Row: {
          clinic_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          parent_term_id: string | null
          term_type: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          clinic_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_term_id?: string | null
          term_type?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          clinic_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_term_id?: string | null
          term_type?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "consent_terms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_terms_parent_term_id_fkey"
            columns: ["parent_term_id"]
            isOneToOne: false
            referencedRelation: "consent_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_followups: {
        Row: {
          assigned_to: string | null
          clinic_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          followup_type: string
          id: string
          lead_id: string | null
          notes: string | null
          opportunity_id: string | null
          patient_id: string | null
          scheduled_at: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          clinic_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          followup_type?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          patient_id?: string | null
          scheduled_at: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          clinic_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          followup_type?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          patient_id?: string | null
          scheduled_at?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_followups_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followups_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_followups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_goals: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          current_value: number
          goal_type: string
          id: string
          period_end: string
          period_start: string
          professional_id: string | null
          specialty_id: string | null
          status: string
          target_value: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          current_value?: number
          goal_type?: string
          id?: string
          period_end: string
          period_start: string
          professional_id?: string | null
          specialty_id?: string | null
          status?: string
          target_value: number
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          current_value?: number
          goal_type?: string
          id?: string
          period_end?: string
          period_start?: string
          professional_id?: string | null
          specialty_id?: string | null
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_goals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_goals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_goals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          birth_date: string | null
          campaign_name: string | null
          clinic_id: string
          converted_patient_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gender: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string | null
          phone: string | null
          procedure_interest_id: string | null
          source: string | null
          specialty_interest_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          birth_date?: string | null
          campaign_name?: string | null
          clinic_id: string
          converted_patient_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id?: string | null
          phone?: string | null
          procedure_interest_id?: string | null
          source?: string | null
          specialty_interest_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          birth_date?: string | null
          campaign_name?: string | null
          clinic_id?: string
          converted_patient_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string | null
          phone?: string | null
          procedure_interest_id?: string | null
          source?: string | null
          specialty_interest_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_converted_patient_id_fkey"
            columns: ["converted_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_procedure_interest_id_fkey"
            columns: ["procedure_interest_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_specialty_interest_id_fkey"
            columns: ["specialty_interest_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_loss_reasons: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_loss_reasons_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          assigned_to_user_id: string | null
          clinic_id: string
          closed_at: string | null
          closing_probability: number | null
          created_at: string
          created_by: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          is_lost: boolean
          is_won: boolean
          lead_id: string | null
          loss_reason: string | null
          loss_reason_id: string | null
          notes: string | null
          patient_id: string | null
          pipeline_stage_id: string | null
          procedure_id: string | null
          professional_id: string | null
          specialty_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          clinic_id: string
          closed_at?: string | null
          closing_probability?: number | null
          created_at?: string
          created_by?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          is_lost?: boolean
          is_won?: boolean
          lead_id?: string | null
          loss_reason?: string | null
          loss_reason_id?: string | null
          notes?: string | null
          patient_id?: string | null
          pipeline_stage_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          specialty_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          clinic_id?: string
          closed_at?: string | null
          closing_probability?: number | null
          created_at?: string
          created_by?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          is_lost?: boolean
          is_won?: boolean
          lead_id?: string | null
          loss_reason?: string | null
          loss_reason_id?: string | null
          notes?: string | null
          patient_id?: string | null
          pipeline_stage_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          specialty_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_loss_reason_id_fkey"
            columns: ["loss_reason_id"]
            isOneToOne: false
            referencedRelation: "crm_loss_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunity_history: {
        Row: {
          changed_by: string | null
          clinic_id: string
          created_at: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          opportunity_id: string
        }
        Insert: {
          changed_by?: string | null
          clinic_id: string
          created_at?: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          opportunity_id: string
        }
        Update: {
          changed_by?: string | null
          clinic_id?: string
          created_at?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunity_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          clinic_id: string
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quote_items: {
        Row: {
          clinic_id: string
          created_at: string
          description: string
          discount_percent: number
          id: string
          package_id: string | null
          procedure_id: string | null
          professional_id: string | null
          quantity: number
          quote_id: string
          specialty_id: string | null
          total_value: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description: string
          discount_percent?: number
          id?: string
          package_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number
          quote_id: string
          specialty_id?: string | null
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string
          discount_percent?: number
          id?: string
          package_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number
          quote_id?: string
          specialty_id?: string | null
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_quote_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quote_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quote_items_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "crm_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quote_items_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotes: {
        Row: {
          approved_at: string | null
          clinic_id: string
          converted_at: string | null
          created_at: string
          created_by: string | null
          discount_percent: number | null
          discount_value: number
          final_value: number
          id: string
          lead_id: string | null
          notes: string | null
          opportunity_id: string | null
          patient_id: string | null
          professional_id: string | null
          quote_number: string | null
          rejected_at: string | null
          status: string
          terms_text: string | null
          total_value: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          clinic_id: string
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          discount_value?: number
          final_value?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          patient_id?: string | null
          professional_id?: string | null
          quote_number?: string | null
          rejected_at?: string | null
          status?: string
          terms_text?: string | null
          total_value?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          clinic_id?: string
          converted_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          discount_value?: number
          final_value?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          patient_id?: string | null
          professional_id?: string | null
          quote_number?: string | null
          rejected_at?: string | null
          status?: string
          terms_text?: string | null
          total_value?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_prontuario_fields: {
        Row: {
          all_appointments: boolean | null
          clinic_id: string
          config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          field_key: string
          field_order: number
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          label: string
          name: string | null
          options: Json | null
          placeholder: string | null
          procedure_id: string | null
          specialty_id: string | null
          tab_key: string
          updated_at: string
        }
        Insert: {
          all_appointments?: boolean | null
          clinic_id: string
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          field_key: string
          field_order?: number
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          label: string
          name?: string | null
          options?: Json | null
          placeholder?: string | null
          procedure_id?: string | null
          specialty_id?: string | null
          tab_key: string
          updated_at?: string
        }
        Update: {
          all_appointments?: boolean | null
          clinic_id?: string
          config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          field_key?: string
          field_order?: number
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          label?: string
          name?: string | null
          options?: Json | null
          placeholder?: string | null
          procedure_id?: string | null
          specialty_id?: string | null
          tab_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_prontuario_fields_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_prontuario_fields_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_prontuario_fields_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_clinicos: {
        Row: {
          clinic_id: string
          conteudo: Json | null
          created_at: string
          id: string
          patient_id: string
          professional_id: string | null
          status: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          conteudo?: Json | null
          created_at?: string
          id?: string
          patient_id: string
          professional_id?: string | null
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          conteudo?: Json | null
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_clinicos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_clinicos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_clinicos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_log: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          details: Json | null
          document_id: string | null
          document_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          details?: Json | null
          document_id?: string | null
          document_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          details?: Json | null
          document_id?: string | null
          document_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_log_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_map_applications: {
        Row: {
          created_at: string
          data: Json | null
          facial_map_id: string
          id: string
          notes: string | null
          product_name: string | null
          region: string | null
          units: number | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          facial_map_id: string
          id?: string
          notes?: string | null
          product_name?: string | null
          region?: string | null
          units?: number | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          facial_map_id?: string
          id?: string
          notes?: string | null
          product_name?: string | null
          region?: string | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facial_map_applications_facial_map_id_fkey"
            columns: ["facial_map_id"]
            isOneToOne: false
            referencedRelation: "facial_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_map_images: {
        Row: {
          annotations: Json | null
          created_at: string
          facial_map_id: string
          id: string
          image_url: string
        }
        Insert: {
          annotations?: Json | null
          created_at?: string
          facial_map_id: string
          id?: string
          image_url: string
        }
        Update: {
          annotations?: Json | null
          created_at?: string
          facial_map_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "facial_map_images_facial_map_id_fkey"
            columns: ["facial_map_id"]
            isOneToOne: false
            referencedRelation: "facial_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_maps: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json | null
          id: string
          map_type: string | null
          notes: string | null
          patient_id: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json | null
          id?: string
          map_type?: string | null
          notes?: string | null
          patient_id: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json | null
          id?: string
          map_type?: string | null
          notes?: string | null
          patient_id?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facial_maps_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_maps_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_maps_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          clinic_id: string
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          clinic_id: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          clinic_id?: string
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          category_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          notes: string | null
          origin: string | null
          paid_at: string | null
          patient_id: string | null
          payment_method: string | null
          payment_method_id: string | null
          professional_id: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          category_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          origin?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          professional_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          category_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          origin?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          professional_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      idle_alert_settings: {
        Row: {
          alert_type: string
          clinic_id: string
          created_at: string
          id: string
          idle_threshold_minutes: number
          is_active: boolean
          updated_at: string
        }
        Insert: {
          alert_type?: string
          clinic_id: string
          created_at?: string
          id?: string
          idle_threshold_minutes?: number
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          alert_type?: string
          clinic_id?: string
          created_at?: string
          id?: string
          idle_threshold_minutes?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idle_alert_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      instrumentos_psicologicos: {
        Row: {
          categoria_instrumento: string | null
          clinic_id: string
          contexto_aplicacao: string | null
          created_at: string
          data_aplicacao: string | null
          documento_nome: string | null
          documento_url: string | null
          finalidade: string | null
          id: string
          interpretacao_inicial: string | null
          nome: string
          nome_instrumento: string | null
          objetivo_aplicacao: string | null
          observacoes: string | null
          patient_id: string
          professional_id: string | null
          profissional_id: string | null
          profissional_nome: string | null
          resultado: Json | null
          resultado_resumido: string | null
          status_instrumento: string | null
          tipo: string | null
        }
        Insert: {
          categoria_instrumento?: string | null
          clinic_id: string
          contexto_aplicacao?: string | null
          created_at?: string
          data_aplicacao?: string | null
          documento_nome?: string | null
          documento_url?: string | null
          finalidade?: string | null
          id?: string
          interpretacao_inicial?: string | null
          nome: string
          nome_instrumento?: string | null
          objetivo_aplicacao?: string | null
          observacoes?: string | null
          patient_id: string
          professional_id?: string | null
          profissional_id?: string | null
          profissional_nome?: string | null
          resultado?: Json | null
          resultado_resumido?: string | null
          status_instrumento?: string | null
          tipo?: string | null
        }
        Update: {
          categoria_instrumento?: string | null
          clinic_id?: string
          contexto_aplicacao?: string | null
          created_at?: string
          data_aplicacao?: string | null
          documento_nome?: string | null
          documento_url?: string | null
          finalidade?: string | null
          id?: string
          interpretacao_inicial?: string | null
          nome?: string
          nome_instrumento?: string | null
          objetivo_aplicacao?: string | null
          observacoes?: string | null
          patient_id?: string
          professional_id?: string | null
          profissional_id?: string | null
          profissional_nome?: string | null
          resultado?: Json | null
          resultado_resumido?: string | null
          status_instrumento?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instrumentos_psicologicos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instrumentos_psicologicos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instrumentos_psicologicos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instrumentos_psicologicos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_authorizations: {
        Row: {
          authorization_number: string | null
          authorized_at: string | null
          clinic_id: string
          created_at: string
          expires_at: string | null
          id: string
          insurance_id: string
          notes: string | null
          patient_id: string
          procedure_id: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          authorization_number?: string | null
          authorized_at?: string | null
          clinic_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          insurance_id: string
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          authorization_number?: string | null
          authorized_at?: string | null
          clinic_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          insurance_id?: string
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_authorizations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_authorizations_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_authorizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_authorizations_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_fee_calculations: {
        Row: {
          appointment_id: string | null
          approved_amount: number | null
          calculated_amount: number
          clinic_id: string
          clinic_net_value: number | null
          created_at: string
          fee_fixed_value: number | null
          fee_percentage: number | null
          fee_type: string | null
          gloss_amount: number | null
          gross_value: number | null
          guide_id: string | null
          id: string
          insurance_id: string
          notes: string | null
          patient_id: string | null
          payment_date: string | null
          payment_due_date: string | null
          procedure_id: string | null
          professional_fee: number | null
          professional_id: string | null
          reference_period: string | null
          service_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          approved_amount?: number | null
          calculated_amount: number
          clinic_id: string
          clinic_net_value?: number | null
          created_at?: string
          fee_fixed_value?: number | null
          fee_percentage?: number | null
          fee_type?: string | null
          gloss_amount?: number | null
          gross_value?: number | null
          guide_id?: string | null
          id?: string
          insurance_id: string
          notes?: string | null
          patient_id?: string | null
          payment_date?: string | null
          payment_due_date?: string | null
          procedure_id?: string | null
          professional_fee?: number | null
          professional_id?: string | null
          reference_period?: string | null
          service_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          approved_amount?: number | null
          calculated_amount?: number
          clinic_id?: string
          clinic_net_value?: number | null
          created_at?: string
          fee_fixed_value?: number | null
          fee_percentage?: number | null
          fee_type?: string | null
          gloss_amount?: number | null
          gross_value?: number | null
          guide_id?: string | null
          id?: string
          insurance_id?: string
          notes?: string | null
          patient_id?: string | null
          payment_date?: string | null
          payment_due_date?: string | null
          procedure_id?: string | null
          professional_fee?: number | null
          professional_id?: string | null
          reference_period?: string | null
          service_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_fee_calculations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_calculations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_calculations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tiss_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_calculations_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_calculations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_calculations_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_calculations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_fee_rules: {
        Row: {
          clinic_id: string | null
          config: Json
          created_at: string
          description: string | null
          fee_type: string | null
          fee_value: number | null
          id: string
          insurance_id: string
          is_active: boolean
          payment_deadline_days: number | null
          procedure_id: string | null
          professional_id: string | null
          rule_type: string
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          fee_type?: string | null
          fee_value?: number | null
          id?: string
          insurance_id: string
          is_active?: boolean
          payment_deadline_days?: number | null
          procedure_id?: string | null
          professional_id?: string | null
          rule_type: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          fee_type?: string | null
          fee_value?: number | null
          id?: string
          insurance_id?: string
          is_active?: boolean
          payment_deadline_days?: number | null
          procedure_id?: string | null
          professional_id?: string | null
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_fee_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_rules_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_rules_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_fee_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_procedures: {
        Row: {
          authorized_price: number | null
          created_at: string
          id: string
          insurance_id: string
          procedure_id: string
          requires_authorization: boolean
          tuss_code: string | null
        }
        Insert: {
          authorized_price?: number | null
          created_at?: string
          id?: string
          insurance_id: string
          procedure_id: string
          requires_authorization?: boolean
          tuss_code?: string | null
        }
        Update: {
          authorized_price?: number | null
          created_at?: string
          id?: string
          insurance_id?: string
          procedure_id?: string
          requires_authorization?: boolean
          tuss_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_procedures_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          allowed_guide_types: string[] | null
          ans_code: string | null
          clinic_id: string
          code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          default_fee_type: string | null
          default_fee_value: number | null
          default_payment_deadline_days: number | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          requires_authorization: boolean
          return_allowed: boolean
          return_days: number
          tiss_code: string | null
          updated_at: string
        }
        Insert: {
          allowed_guide_types?: string[] | null
          ans_code?: string | null
          clinic_id: string
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_fee_type?: string | null
          default_fee_value?: number | null
          default_payment_deadline_days?: number | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          requires_authorization?: boolean
          return_allowed?: boolean
          return_days?: number
          tiss_code?: string | null
          updated_at?: string
        }
        Update: {
          allowed_guide_types?: string[] | null
          ans_code?: string | null
          clinic_id?: string
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          default_fee_type?: string | null
          default_fee_value?: number | null
          default_payment_deadline_days?: number | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          requires_authorization?: boolean
          return_allowed?: boolean
          return_days?: number
          tiss_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurances_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      interactive_map_annotations: {
        Row: {
          annotations: Json
          clinic_id: string
          created_at: string
          id: string
          map_type: string
          notes: string | null
          patient_id: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          annotations?: Json
          clinic_id: string
          created_at?: string
          id?: string
          map_type?: string
          notes?: string | null
          patient_id: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          annotations?: Json
          clinic_id?: string
          created_at?: string
          id?: string
          map_type?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactive_map_annotations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactive_map_annotations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactive_map_annotations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      material_consumption: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string | null
          product_id: string
          professional_id: string | null
          quantity: number
          stock_movement_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          product_id: string
          professional_id?: string | null
          quantity: number
          stock_movement_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          product_id?: string
          professional_id?: string | null
          quantity?: number
          stock_movement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_consumption_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      material_kit_items: {
        Row: {
          created_at: string
          id: string
          kit_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          kit_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          kit_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_kit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_action_permissions: {
        Row: {
          action_key: string
          allowed: boolean
          clinic_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          action_key: string
          allowed?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          role: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          allowed?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_action_permissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_fields: {
        Row: {
          clinic_id: string
          config: Json | null
          created_at: string
          field_key: string
          field_order: number
          field_type: string
          id: string
          is_required: boolean
          label: string
          options: Json | null
          placeholder: string | null
          tab_key: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          config?: Json | null
          created_at?: string
          field_key: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          tab_key: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          config?: Json | null
          created_at?: string
          field_key?: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          tab_key?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_fields_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "medical_record_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_security_config: {
        Row: {
          allow_evolution_edit_minutes: number
          audit_enabled: boolean
          audit_retention_days: number
          clinic_id: string
          created_at: string
          id: string
          lock_after_signature: boolean
          require_consent_before_access: boolean
          require_justification_for_addendum: boolean
          require_justification_for_edit: boolean
          signature_blocks_immediately: boolean
          signature_lock_hours: number
          updated_at: string
        }
        Insert: {
          allow_evolution_edit_minutes?: number
          audit_enabled?: boolean
          audit_retention_days?: number
          clinic_id: string
          created_at?: string
          id?: string
          lock_after_signature?: boolean
          require_consent_before_access?: boolean
          require_justification_for_addendum?: boolean
          require_justification_for_edit?: boolean
          signature_blocks_immediately?: boolean
          signature_lock_hours?: number
          updated_at?: string
        }
        Update: {
          allow_evolution_edit_minutes?: number
          audit_enabled?: boolean
          audit_retention_days?: number
          clinic_id?: string
          created_at?: string
          id?: string
          lock_after_signature?: boolean
          require_consent_before_access?: boolean
          require_justification_for_addendum?: boolean
          require_justification_for_edit?: boolean
          signature_blocks_immediately?: boolean
          signature_lock_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_security_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_signatures: {
        Row: {
          clinic_id: string
          id: string
          ip_address: string | null
          record_id: string
          record_type: string
          signature_hash: string | null
          signed_at: string
          signed_by: string
          user_agent: string | null
        }
        Insert: {
          clinic_id: string
          id?: string
          ip_address?: string | null
          record_id: string
          record_type: string
          signature_hash?: string | null
          signed_at?: string
          signed_by: string
          user_agent?: string | null
        }
        Update: {
          clinic_id?: string
          id?: string
          ip_address?: string | null
          record_id?: string
          record_type?: string
          signature_hash?: string | null
          signed_at?: string
          signed_by?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_signatures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_tab_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          label: string
          options: Json | null
          placeholder: string | null
          sort_order: number
          tab_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          sort_order?: number
          tab_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          sort_order?: number
          tab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_tab_fields_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "medical_record_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_tab_permissions: {
        Row: {
          can_edit: boolean
          can_export: boolean
          can_sign: boolean
          can_view: boolean
          clinic_id: string
          created_at: string
          id: string
          role: string
          tab_key: string
          updated_at: string
        }
        Insert: {
          can_edit?: boolean
          can_export?: boolean
          can_sign?: boolean
          can_view?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          role: string
          tab_key: string
          updated_at?: string
        }
        Update: {
          can_edit?: boolean
          can_export?: boolean
          can_sign?: boolean
          can_view?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          role?: string
          tab_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_tab_permissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_tabs: {
        Row: {
          clinic_id: string
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          key: string | null
          name: string
          professional_id: string | null
          scope: string | null
          slug: string
          sort_order: number
          specialty_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string | null
          name: string
          professional_id?: string | null
          scope?: string | null
          slug: string
          sort_order?: number
          specialty_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string | null
          name?: string
          professional_id?: string | null
          scope?: string | null
          slug?: string
          sort_order?: number
          specialty_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_tabs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_tabs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_tabs_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_templates: {
        Row: {
          clinic_id: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_system: boolean
          name: string
          professional_id: string | null
          scope: string | null
          specialty_id: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name: string
          professional_id?: string | null
          scope?: string | null
          specialty_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name?: string
          professional_id?: string | null
          scope?: string | null
          specialty_id?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_templates_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_visual_settings: {
        Row: {
          accent_color: string | null
          clinic_id: string
          created_at: string
          font_size: string | null
          id: string
          layout: string | null
          logo_position: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          clinic_id: string
          created_at?: string
          font_size?: string | null
          id?: string
          layout?: string | null
          logo_position?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          clinic_id?: string
          created_at?: string
          font_size?: string | null
          id?: string
          layout?: string | null
          logo_position?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_visual_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          channel: string
          clinic_id: string
          content: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          patient_id: string | null
          read_at: string | null
          recipient: string
          sent_at: string
          status: string
          template_id: string | null
        }
        Insert: {
          channel: string
          clinic_id: string
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          patient_id?: string | null
          read_at?: string | null
          recipient: string
          sent_at?: string
          status?: string
          template_id?: string | null
        }
        Update: {
          channel?: string
          clinic_id?: string
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          patient_id?: string | null
          read_at?: string | null
          recipient?: string
          sent_at?: string
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_queue: {
        Row: {
          appointment_id: string | null
          attempts: number
          automation_rule_id: string | null
          campaign_id: string | null
          channel: string
          clinic_id: string
          created_at: string
          error_message: string | null
          id: string
          message_body: string
          notes: string | null
          origin: string
          patient_id: string | null
          phone: string
          provider_response: Json | null
          rendered_message: string | null
          scheduled_for: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number
          automation_rule_id?: string | null
          campaign_id?: string | null
          channel?: string
          clinic_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_body?: string
          notes?: string | null
          origin?: string
          patient_id?: string | null
          phone?: string
          provider_response?: Json | null
          rendered_message?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          attempts?: number
          automation_rule_id?: string | null
          campaign_id?: string | null
          channel?: string
          clinic_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_body?: string
          notes?: string | null
          origin?: string
          patient_id?: string | null
          phone?: string
          provider_response?: Json | null
          rendered_message?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string | null
          channel: string
          clinic_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean | null
          name: string
          subject: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          channel?: string
          clinic_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          channel?: string
          clinic_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_documento: {
        Row: {
          cabecalho_personalizado: string | null
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          nome: string
          rodape: string | null
          texto_padrao: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cabecalho_personalizado?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          nome: string
          rodape?: string | null
          texto_padrao?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          cabecalho_personalizado?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          nome?: string
          rodape?: string | null
          texto_padrao?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_documento_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_receita_profissional: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          itens: Json
          nome: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          itens?: Json
          nome: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          itens?: Json
          nome?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_receita_profissional_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelos_receita_profissional_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          actions: Database["public"]["Enums"]["app_action"][]
          clinic_id: string
          created_at: string
          id: string
          module: Database["public"]["Enums"]["app_module"]
          restrictions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Database["public"]["Enums"]["app_action"][]
          clinic_id: string
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["app_module"]
          restrictions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Database["public"]["Enums"]["app_action"][]
          clinic_id?: string
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["app_module"]
          restrictions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_permissions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_records: {
        Row: {
          condition: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          odontogram_id: string
          procedure_id: string | null
          surface: string | null
          tooth_number: number
        }
        Insert: {
          condition: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          odontogram_id: string
          procedure_id?: string | null
          surface?: string | null
          tooth_number: number
        }
        Update: {
          condition?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          odontogram_id?: string
          procedure_id?: string | null
          surface?: string | null
          tooth_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_records_odontogram_id_fkey"
            columns: ["odontogram_id"]
            isOneToOne: false
            referencedRelation: "odontograms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_records_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_teeth: {
        Row: {
          conditions: Json | null
          created_at: string
          id: string
          notes: string | null
          odontogram_id: string
          status: string | null
          tooth_number: number
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          odontogram_id: string
          status?: string | null
          tooth_number: number
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          odontogram_id?: string
          status?: string | null
          tooth_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_teeth_odontogram_id_fkey"
            columns: ["odontogram_id"]
            isOneToOne: false
            referencedRelation: "odontograms"
            referencedColumns: ["id"]
          },
        ]
      }
      odontograms: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json
          id: string
          patient_id: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json
          id?: string
          patient_id: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json
          id?: string
          patient_id?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontograms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontograms_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          clinic_id: string
          completed_at: string | null
          completed_steps: Json
          created_at: string
          current_step: number
          id: string
          is_completed: boolean
          preferences: Json | null
          skipped_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          preferences?: Json | null
          skipped_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          is_completed?: boolean
          preferences?: Json | null
          skipped_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_anamnese_psicologia: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json | null
          historico_familiar: string | null
          historico_pessoal: string | null
          id: string
          medicamentos: string | null
          patient_id: string
          professional_id: string | null
          queixa_principal: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json | null
          historico_familiar?: string | null
          historico_pessoal?: string | null
          id?: string
          medicamentos?: string | null
          patient_id: string
          professional_id?: string | null
          queixa_principal?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json | null
          historico_familiar?: string | null
          historico_pessoal?: string | null
          id?: string
          medicamentos?: string | null
          patient_id?: string
          professional_id?: string | null
          queixa_principal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_anamnese_psicologia_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamnese_psicologia_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamnese_psicologia_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_anamneses: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json
          id: string
          patient_id: string
          professional_id: string | null
          specialty_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json
          id?: string
          patient_id: string
          professional_id?: string | null
          specialty_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json
          id?: string
          patient_id?: string
          professional_id?: string | null
          specialty_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_anamneses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamneses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamneses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_anamneses_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_clinical_data: {
        Row: {
          allergies: string[]
          blood_type: string | null
          chronic_diseases: string[]
          clinic_id: string
          clinical_restrictions: string | null
          created_at: string
          current_medications: string[]
          family_history: string | null
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[]
          blood_type?: string | null
          chronic_diseases?: string[]
          clinic_id: string
          clinical_restrictions?: string | null
          created_at?: string
          current_medications?: string[]
          family_history?: string | null
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[]
          blood_type?: string | null
          chronic_diseases?: string[]
          clinic_id?: string
          clinical_restrictions?: string | null
          created_at?: string
          current_medications?: string[]
          family_history?: string | null
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinical_data_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_clinical_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_clinical_flags: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          flag_type: string
          id: string
          is_active: boolean
          patient_id: string
          severity: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          flag_type: string
          id?: string
          is_active?: boolean
          patient_id: string
          severity?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          flag_type?: string
          id?: string
          is_active?: boolean
          patient_id?: string
          severity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinical_flags_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_clinical_flags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_condutas: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json | null
          descricao: string
          id: string
          patient_id: string
          professional_id: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json | null
          descricao: string
          id?: string
          patient_id: string
          professional_id?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json | null
          descricao?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_condutas_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_condutas_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_condutas_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          clinic_id: string
          created_at: string
          granted_at: string | null
          granted_by: string | null
          id: string
          ip_address: string | null
          patient_id: string
          revoked_at: string | null
          revoked_by: string | null
          signature_data: string | null
          status: Database["public"]["Enums"]["consent_status"]
          term_id: string
          term_version: number | null
          user_agent: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["consent_status"]
          term_id: string
          term_version?: number | null
          user_agent?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["consent_status"]
          term_id?: string
          term_version?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "consent_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_diagnosticos: {
        Row: {
          clinic_id: string
          codigo_cid: string | null
          created_at: string
          data: Json | null
          descricao: string
          id: string
          patient_id: string
          professional_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          codigo_cid?: string | null
          created_at?: string
          data?: Json | null
          descricao: string
          id?: string
          patient_id: string
          professional_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          codigo_cid?: string | null
          created_at?: string
          data?: Json | null
          descricao?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnosticos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnosticos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_diagnosticos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documentos: {
        Row: {
          clinic_id: string
          conteudo: Json | null
          created_at: string
          file_url: string | null
          id: string
          patient_id: string
          professional_id: string | null
          status: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          conteudo?: Json | null
          created_at?: string
          file_url?: string | null
          id?: string
          patient_id: string
          professional_id?: string | null
          status?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          conteudo?: Json | null
          created_at?: string
          file_url?: string | null
          id?: string
          patient_id?: string
          professional_id?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documentos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documentos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documentos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_evolucoes: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          data: Json
          id: string
          notes: string | null
          patient_id: string
          professional_id: string | null
          specialty_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          patient_id: string
          professional_id?: string | null
          specialty_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string | null
          specialty_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_evolucoes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evolucoes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evolucoes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evolucoes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_evolucoes_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_exames_fisicos: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json
          id: string
          notes: string | null
          patient_id: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          patient_id: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_exames_fisicos_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_exames_fisicos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_exames_fisicos_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_generated_documents: {
        Row: {
          clinic_id: string
          content: Json | null
          created_at: string
          document_type: string
          id: string
          patient_id: string
          pdf_url: string | null
          professional_id: string | null
          signed_at: string | null
          signed_by: string | null
          status: string | null
          title: string
          updated_at: string
          validation_code: string | null
        }
        Insert: {
          clinic_id: string
          content?: Json | null
          created_at?: string
          document_type: string
          id?: string
          patient_id: string
          pdf_url?: string | null
          professional_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string
          validation_code?: string | null
        }
        Update: {
          clinic_id?: string
          content?: Json | null
          created_at?: string
          document_type?: string
          id?: string
          patient_id?: string
          pdf_url?: string | null
          professional_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          validation_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_generated_documents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_generated_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_generated_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_guardians: {
        Row: {
          clinic_id: string
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          is_primary: boolean
          patient_id: string
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cpf?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_primary?: boolean
          patient_id: string
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          patient_id?: string
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_guardians_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_guardians_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_insurances: {
        Row: {
          card_number: string | null
          clinic_id: string
          created_at: string
          holder_cpf: string | null
          holder_name: string | null
          holder_type: string | null
          id: string
          insurance_id: string
          is_active: boolean
          is_primary: boolean
          notes: string | null
          patient_id: string
          plan_name: string | null
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          card_number?: string | null
          clinic_id: string
          created_at?: string
          holder_cpf?: string | null
          holder_name?: string | null
          holder_type?: string | null
          id?: string
          insurance_id: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          patient_id: string
          plan_name?: string | null
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          card_number?: string | null
          clinic_id?: string
          created_at?: string
          holder_cpf?: string | null
          holder_name?: string | null
          holder_type?: string | null
          id?: string
          insurance_id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          patient_id?: string
          plan_name?: string | null
          updated_at?: string
          validity_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_insurances_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_insurances_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_insurances_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_pre_registration_links: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          full_name: string | null
          id: string
          patient_id: string | null
          phone: string | null
          status: string
          submitted_at: string | null
          submitted_data: Json | null
          token: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at: string
          full_name?: string | null
          id?: string
          patient_id?: string | null
          phone?: string | null
          status?: string
          submitted_at?: string | null
          submitted_data?: Json | null
          token: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          full_name?: string | null
          id?: string
          patient_id?: string | null
          phone?: string | null
          status?: string
          submitted_at?: string | null
          submitted_data?: Json | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_pre_registration_links_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_pre_registration_links_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_pre_registration_links_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_prescricao_itens: {
        Row: {
          created_at: string
          dosagem: string | null
          duracao: string | null
          frequencia: string | null
          id: string
          medicamento: string
          observacoes: string | null
          ordem: number | null
          prescricao_id: string
          via: string | null
        }
        Insert: {
          created_at?: string
          dosagem?: string | null
          duracao?: string | null
          frequencia?: string | null
          id?: string
          medicamento: string
          observacoes?: string | null
          ordem?: number | null
          prescricao_id: string
          via?: string | null
        }
        Update: {
          created_at?: string
          dosagem?: string | null
          duracao?: string | null
          frequencia?: string | null
          id?: string
          medicamento?: string
          observacoes?: string | null
          ordem?: number | null
          prescricao_id?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_prescricao_itens_prescricao_id_fkey"
            columns: ["prescricao_id"]
            isOneToOne: false
            referencedRelation: "patient_prescricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_prescricoes: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json
          id: string
          patient_id: string
          professional_id: string | null
          signed_at: string | null
          signed_by: string | null
          status: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json
          id?: string
          patient_id: string
          professional_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json
          id?: string
          patient_id?: string
          professional_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_prescricoes_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_prescricoes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_prescricoes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_scale_readings: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          professional_id: string | null
          scale_id: string
          value: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          professional_id?: string | null
          scale_id: string
          value: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string | null
          scale_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_scale_readings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_scale_readings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_scale_readings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_scale_readings_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "clinical_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          avatar_url: string | null
          birth_date: string | null
          clinic_id: string
          clinical_alert_text: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          has_clinical_alert: boolean
          id: string
          is_active: boolean
          marital_status: string | null
          notes: string | null
          phone: string | null
          rg: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          clinic_id: string
          clinical_alert_text?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          has_clinical_alert?: boolean
          id?: string
          is_active?: boolean
          marital_status?: string | null
          notes?: string | null
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          clinic_id?: string
          clinical_alert_text?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          has_clinical_alert?: boolean
          id?: string
          is_active?: boolean
          marital_status?: string | null
          notes?: string | null
          phone?: string | null
          rg?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          accepts_change: boolean
          account_digit: string | null
          account_holder_document: string | null
          account_holder_name: string | null
          account_number: string | null
          account_type: string | null
          acquirer_name: string | null
          agency: string | null
          allows_installments: boolean
          auto_settle: boolean
          bank_code: string | null
          bank_name: string | null
          card_brands: string[] | null
          category: string
          clinic_id: string
          code: string
          color: string | null
          created_at: string
          default_entry_account: string | null
          description: string | null
          display_order: number
          fee_percent: number | null
          fee_type: string | null
          fee_value: number | null
          fixed_fee: number | null
          icon: string | null
          id: string
          insurance_id: string | null
          is_active: boolean
          is_default: boolean
          is_system: boolean
          max_installments: number
          method_type: string
          name: string
          notes: string | null
          pix_key: string | null
          pix_key_type: string | null
          requires_authorization_code: boolean
          requires_due_date: boolean
          settlement_days: number | null
          updated_at: string
          wallet_provider: string | null
        }
        Insert: {
          accepts_change?: boolean
          account_digit?: string | null
          account_holder_document?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          acquirer_name?: string | null
          agency?: string | null
          allows_installments?: boolean
          auto_settle?: boolean
          bank_code?: string | null
          bank_name?: string | null
          card_brands?: string[] | null
          category?: string
          clinic_id: string
          code: string
          color?: string | null
          created_at?: string
          default_entry_account?: string | null
          description?: string | null
          display_order?: number
          fee_percent?: number | null
          fee_type?: string | null
          fee_value?: number | null
          fixed_fee?: number | null
          icon?: string | null
          id?: string
          insurance_id?: string | null
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          max_installments?: number
          method_type?: string
          name: string
          notes?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          requires_authorization_code?: boolean
          requires_due_date?: boolean
          settlement_days?: number | null
          updated_at?: string
          wallet_provider?: string | null
        }
        Update: {
          accepts_change?: boolean
          account_digit?: string | null
          account_holder_document?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          acquirer_name?: string | null
          agency?: string | null
          allows_installments?: boolean
          auto_settle?: boolean
          bank_code?: string | null
          bank_name?: string | null
          card_brands?: string[] | null
          category?: string
          clinic_id?: string
          code?: string
          color?: string | null
          created_at?: string
          default_entry_account?: string | null
          description?: string | null
          display_order?: number
          fee_percent?: number | null
          fee_type?: string | null
          fee_value?: number | null
          fixed_fee?: number | null
          icon?: string | null
          id?: string
          insurance_id?: string | null
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          max_installments?: number
          method_type?: string
          name?: string
          notes?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          requires_authorization_code?: boolean
          requires_due_date?: boolean
          settlement_days?: number | null
          updated_at?: string
          wallet_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_templates: {
        Row: {
          actions: Database["public"]["Enums"]["app_action"][]
          created_at: string
          id: string
          is_system: boolean
          module: Database["public"]["Enums"]["app_module"]
          restrictions: Json | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          actions?: Database["public"]["Enums"]["app_action"][]
          created_at?: string
          id?: string
          is_system?: boolean
          module: Database["public"]["Enums"]["app_module"]
          restrictions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          actions?: Database["public"]["Enums"]["app_action"][]
          created_at?: string
          id?: string
          is_system?: boolean
          module?: Database["public"]["Enums"]["app_module"]
          restrictions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      plano_terapeutico_psicologia: {
        Row: {
          abordagem: string | null
          clinic_id: string
          created_at: string
          data: Json | null
          frequencia: string | null
          id: string
          objetivos: string | null
          patient_id: string
          professional_id: string | null
          status: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          abordagem?: string | null
          clinic_id: string
          created_at?: string
          data?: Json | null
          frequencia?: string | null
          id?: string
          objetivos?: string | null
          patient_id: string
          professional_id?: string | null
          status?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          abordagem?: string | null
          clinic_id?: string
          created_at?: string
          data?: Json | null
          frequencia?: string | null
          id?: string
          objetivos?: string | null
          patient_id?: string
          professional_id?: string | null
          status?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_terapeutico_psicologia_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_terapeutico_psicologia_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_terapeutico_psicologia_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_acao_crise: {
        Row: {
          acoes: string | null
          clinic_id: string
          contatos_emergencia: Json | null
          created_at: string
          data: Json | null
          id: string
          is_active: boolean
          patient_id: string
          professional_id: string | null
          sinais_alerta: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          acoes?: string | null
          clinic_id: string
          contatos_emergencia?: Json | null
          created_at?: string
          data?: Json | null
          id?: string
          is_active?: boolean
          patient_id: string
          professional_id?: string | null
          sinais_alerta?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          acoes?: string | null
          clinic_id?: string
          contatos_emergencia?: Json | null
          created_at?: string
          data?: Json | null
          id?: string
          is_active?: boolean
          patient_id?: string
          professional_id?: string | null
          sinais_alerta?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_acao_crise_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_crise_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_crise_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_kits: {
        Row: {
          created_at: string
          id: string
          procedure_id: string
          product_kit_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_id: string
          product_kit_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          procedure_id?: string
          product_kit_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedure_kits_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_kits_product_kit_id_fkey"
            columns: ["product_kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_materials: {
        Row: {
          created_at: string
          id: string
          procedure_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          procedure_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedure_materials_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_product_kits: {
        Row: {
          created_at: string
          id: string
          procedure_id: string
          product_kit_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_id: string
          product_kit_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          procedure_id?: string
          product_kit_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedure_product_kits_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_product_kits_product_kit_id_fkey"
            columns: ["product_kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_products: {
        Row: {
          created_at: string
          id: string
          procedure_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          procedure_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedure_products_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_teleconsultation_settings: {
        Row: {
          allows_teleconsultation: boolean
          clinic_id: string
          created_at: string
          id: string
          in_person_only: boolean
          precheck_instructions: string | null
          procedure_id: string
          remote_duration_minutes: number | null
          requires_file_upload: boolean
          requires_precheck: boolean
          requires_telehealth_consent: boolean
          teleconsultation_only: boolean
          updated_at: string
        }
        Insert: {
          allows_teleconsultation?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          in_person_only?: boolean
          precheck_instructions?: string | null
          procedure_id: string
          remote_duration_minutes?: number | null
          requires_file_upload?: boolean
          requires_precheck?: boolean
          requires_telehealth_consent?: boolean
          teleconsultation_only?: boolean
          updated_at?: string
        }
        Update: {
          allows_teleconsultation?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          in_person_only?: boolean
          precheck_instructions?: string | null
          procedure_id?: string
          remote_duration_minutes?: number | null
          requires_file_upload?: boolean
          requires_precheck?: boolean
          requires_telehealth_consent?: boolean
          teleconsultation_only?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_teleconsultation_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_teleconsultation_settings_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: true
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          allows_return: boolean
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number | null
          return_days: number | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          allows_return?: boolean
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          return_days?: number | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          allows_return?: boolean
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          return_days?: number | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kit_items: {
        Row: {
          created_at: string
          id: string
          kit_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          kit_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          kit_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_kit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kits: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_kits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          clinic_id: string
          cost_price: number | null
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          max_stock: number | null
          min_stock: number | null
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          sale_price: number | null
          sku: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_stock?: number | null
          min_stock?: number | null
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sale_price?: number | null
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sale_price?: number | null
          sku?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_authorized_procedures: {
        Row: {
          created_at: string
          id: string
          procedure_id: string
          professional_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_id: string
          professional_id: string
        }
        Update: {
          created_at?: string
          id?: string
          procedure_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_authorized_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_authorized_procedures_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_authorized_rooms: {
        Row: {
          created_at: string
          id: string
          professional_id: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_id: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_authorized_rooms_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_authorized_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedule_config: {
        Row: {
          clinic_id: string
          created_at: string
          default_duration_minutes: number
          id: string
          professional_id: string
          updated_at: string
          use_clinic_default: boolean
          working_days: Json
        }
        Insert: {
          clinic_id: string
          created_at?: string
          default_duration_minutes?: number
          id?: string
          professional_id: string
          updated_at?: string
          use_clinic_default?: boolean
          working_days?: Json
        }
        Update: {
          clinic_id?: string
          created_at?: string
          default_duration_minutes?: number
          id?: string
          professional_id?: string
          updated_at?: string
          use_clinic_default?: boolean
          working_days?: Json
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedule_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_schedule_config_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedules: {
        Row: {
          clinic_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          professional_id: string
          room_id: string | null
          slot_duration_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          professional_id: string
          room_id?: string | null
          slot_duration_minutes?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          professional_id?: string
          room_id?: string | null
          slot_duration_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_schedules_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_specialties: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          professional_id: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          professional_id: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          professional_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_specialties_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          clinic_id: string
          color: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          registration_number: string | null
          specialty_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_id: string
          color?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          registration_number?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string
          color?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          registration_number?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          tour_completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          tour_completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          tour_completed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_diagnostic_hypotheses: {
        Row: {
          clinic_id: string
          comportamentos_observados: string | null
          created_at: string
          data_registro: string
          descricao_clinica: string | null
          fatores_desencadeantes: string | null
          gravidade_impacto: string | null
          hipotese_principal: string
          hipoteses_secundarias: string | null
          id: string
          observacoes: string | null
          patient_id: string
          professional_id: string | null
          professional_name: string | null
          sintomas_observados: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          comportamentos_observados?: string | null
          created_at?: string
          data_registro?: string
          descricao_clinica?: string | null
          fatores_desencadeantes?: string | null
          gravidade_impacto?: string | null
          hipotese_principal: string
          hipoteses_secundarias?: string | null
          id?: string
          observacoes?: string | null
          patient_id: string
          professional_id?: string | null
          professional_name?: string | null
          sintomas_observados?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          comportamentos_observados?: string | null
          created_at?: string
          data_registro?: string
          descricao_clinica?: string | null
          fatores_desencadeantes?: string | null
          gravidade_impacto?: string | null
          hipotese_principal?: string
          hipoteses_secundarias?: string | null
          id?: string
          observacoes?: string | null
          patient_id?: string
          professional_id?: string | null
          professional_name?: string | null
          sintomas_observados?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_diagnostic_hypotheses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_diagnostic_hypotheses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_diagnostic_hypotheses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_session_entries: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          plan_id: string
          session_number: number
          status: string
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plan_id: string
          session_number: number
          status?: string
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          session_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_session_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_session_entries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "recurring_session_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_session_plans: {
        Row: {
          clinic_id: string
          completed_sessions: number
          created_at: string
          frequency: string | null
          id: string
          patient_id: string
          procedure_id: string | null
          professional_id: string
          status: string
          total_sessions: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          completed_sessions?: number
          created_at?: string
          frequency?: string | null
          id?: string
          patient_id: string
          procedure_id?: string | null
          professional_id: string
          status?: string
          total_sessions: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          completed_sessions?: number
          created_at?: string
          frequency?: string | null
          id?: string
          patient_id?: string
          procedure_id?: string | null
          professional_id?: string
          status?: string
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_session_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_session_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_session_plans_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_session_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price: number | null
          created_at: string
          discount_amount: number | null
          id: string
          item_type: string
          margin_percent: number | null
          notes: string | null
          procedure_id: string | null
          product_id: string | null
          product_name: string | null
          profit: number | null
          quantity: number
          sale_id: string
          total_cost: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          item_type?: string
          margin_percent?: number | null
          notes?: string | null
          procedure_id?: string | null
          product_id?: string | null
          product_name?: string | null
          profit?: number | null
          quantity?: number
          sale_id: string
          total_cost?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          item_type?: string
          margin_percent?: number | null
          notes?: string | null
          procedure_id?: string | null
          product_id?: string | null
          product_name?: string | null
          profit?: number | null
          quantity?: number
          sale_id?: string
          total_cost?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          canceled_at: string | null
          canceled_by: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          discount_amount: number
          discount_percent: number | null
          final_amount: number
          id: string
          notes: string | null
          patient_id: string | null
          payment_method: string | null
          payment_status: string | null
          professional_id: string | null
          sale_date: string | null
          sale_number: string | null
          sold_by: string | null
          status: string
          subtotal: number | null
          total_amount: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          canceled_by?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_percent?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          professional_id?: string | null
          sale_date?: string | null
          sale_number?: string | null
          sold_by?: string | null
          status?: string
          subtotal?: number | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          canceled_by?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          discount_percent?: number | null
          final_amount?: number
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          professional_id?: string | null
          sale_date?: string | null
          sale_number?: string | null
          sold_by?: string | null
          status?: string
          subtotal?: number | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_segments: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          filters: Json
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_segments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      scale_specialties: {
        Row: {
          id: string
          scale_id: string
          specialty_id: string
        }
        Insert: {
          id?: string
          scale_id: string
          specialty_id: string
        }
        Update: {
          id?: string
          scale_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scale_specialties_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "clinical_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scale_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          all_day: boolean
          clinic_id: string
          created_at: string
          end_date: string
          end_time: string | null
          id: string
          professional_id: string | null
          reason: string | null
          start_date: string
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          clinic_id: string
          created_at?: string
          end_date: string
          end_time?: string | null
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_date: string
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          clinic_id?: string
          created_at?: string
          end_date?: string
          end_time?: string | null
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_date?: string
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_psicologia: {
        Row: {
          abordagem_terapeutica: string | null
          adesao_terapeutica: string | null
          assinada_em: string | null
          clinic_id: string
          created_at: string
          data_sessao: string | null
          demanda_principal: string | null
          duracao_minutos: number | null
          emocoes_predominantes: string | null
          emocoes_tags: string[] | null
          encaminhamentos_tags: string[] | null
          encaminhamentos_tarefas: string | null
          evolucao_caso: string | null
          gad7_respostas: Json | null
          gad7_total: number | null
          humor_paciente: string | null
          id: string
          intervencoes_realizadas: string | null
          intervencoes_tags: string[] | null
          modalidade: string | null
          numero_sessao: number | null
          objetivo_sessao: string | null
          observacoes: string | null
          observacoes_terapeuta: string | null
          patient_id: string
          phq9_respostas: Json | null
          phq9_total: number | null
          plano_proxima_sessao: string | null
          professional_id: string | null
          profissional_nome: string | null
          proximo_foco: string | null
          relato_paciente: string | null
          resposta_paciente: string | null
          risco_alerta_clinico: string | null
          risco_atual: string | null
          risco_interno: string | null
          status: string | null
          tarefa_casa: string | null
          tecnicas_utilizadas: string | null
          tema_central: string | null
          tipo_atendimento: string | null
          updated_at: string
        }
        Insert: {
          abordagem_terapeutica?: string | null
          adesao_terapeutica?: string | null
          assinada_em?: string | null
          clinic_id: string
          created_at?: string
          data_sessao?: string | null
          demanda_principal?: string | null
          duracao_minutos?: number | null
          emocoes_predominantes?: string | null
          emocoes_tags?: string[] | null
          encaminhamentos_tags?: string[] | null
          encaminhamentos_tarefas?: string | null
          evolucao_caso?: string | null
          gad7_respostas?: Json | null
          gad7_total?: number | null
          humor_paciente?: string | null
          id?: string
          intervencoes_realizadas?: string | null
          intervencoes_tags?: string[] | null
          modalidade?: string | null
          numero_sessao?: number | null
          objetivo_sessao?: string | null
          observacoes?: string | null
          observacoes_terapeuta?: string | null
          patient_id: string
          phq9_respostas?: Json | null
          phq9_total?: number | null
          plano_proxima_sessao?: string | null
          professional_id?: string | null
          profissional_nome?: string | null
          proximo_foco?: string | null
          relato_paciente?: string | null
          resposta_paciente?: string | null
          risco_alerta_clinico?: string | null
          risco_atual?: string | null
          risco_interno?: string | null
          status?: string | null
          tarefa_casa?: string | null
          tecnicas_utilizadas?: string | null
          tema_central?: string | null
          tipo_atendimento?: string | null
          updated_at?: string
        }
        Update: {
          abordagem_terapeutica?: string | null
          adesao_terapeutica?: string | null
          assinada_em?: string | null
          clinic_id?: string
          created_at?: string
          data_sessao?: string | null
          demanda_principal?: string | null
          duracao_minutos?: number | null
          emocoes_predominantes?: string | null
          emocoes_tags?: string[] | null
          encaminhamentos_tags?: string[] | null
          encaminhamentos_tarefas?: string | null
          evolucao_caso?: string | null
          gad7_respostas?: Json | null
          gad7_total?: number | null
          humor_paciente?: string | null
          id?: string
          intervencoes_realizadas?: string | null
          intervencoes_tags?: string[] | null
          modalidade?: string | null
          numero_sessao?: number | null
          objetivo_sessao?: string | null
          observacoes?: string | null
          observacoes_terapeuta?: string | null
          patient_id?: string
          phq9_respostas?: Json | null
          phq9_total?: number | null
          plano_proxima_sessao?: string | null
          professional_id?: string | null
          profissional_nome?: string | null
          proximo_foco?: string | null
          relato_paciente?: string | null
          resposta_paciente?: string | null
          risco_alerta_clinico?: string | null
          risco_atual?: string | null
          risco_interno?: string | null
          status?: string | null
          tarefa_casa?: string | null
          tecnicas_utilizadas?: string | null
          tema_central?: string | null
          tipo_atendimento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_psicologia_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_psicologia_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_psicologia_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          clinic_id: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string | null
          specialty_type: string | null
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug?: string | null
          specialty_type?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string | null
          specialty_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialties_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: string
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          last_triggered_at: string | null
          product_id: string
          threshold: number | null
          updated_at: string
        }
        Insert: {
          alert_type?: string
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          product_id: string
          threshold?: number | null
          updated_at?: string
        }
        Update: {
          alert_type?: string
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          product_id?: string
          threshold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          performed_by: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          unit_cost: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          performed_by?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          performed_by?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_prediction_settings: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          prediction_days: number
          prediction_enabled: boolean
          safety_margin_percent: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          prediction_days?: number
          prediction_enabled?: boolean
          safety_margin_percent?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          prediction_days?: number
          prediction_enabled?: boolean
          safety_margin_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_prediction_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      system_security_settings: {
        Row: {
          allow_patient_data_deletion: boolean | null
          anonymize_reports: boolean | null
          clinic_id: string
          created_at: string
          enable_access_logging: boolean
          enable_digital_signature: boolean
          enable_tab_permissions: boolean
          enforce_consent_before_care: boolean
          id: string
          lock_record_without_consent: boolean
          log_retention_days: number | null
          require_consent_on_registration: boolean | null
          updated_at: string
        }
        Insert: {
          allow_patient_data_deletion?: boolean | null
          anonymize_reports?: boolean | null
          clinic_id: string
          created_at?: string
          enable_access_logging?: boolean
          enable_digital_signature?: boolean
          enable_tab_permissions?: boolean
          enforce_consent_before_care?: boolean
          id?: string
          lock_record_without_consent?: boolean
          log_retention_days?: number | null
          require_consent_on_registration?: boolean | null
          updated_at?: string
        }
        Update: {
          allow_patient_data_deletion?: boolean | null
          anonymize_reports?: boolean | null
          clinic_id?: string
          created_at?: string
          enable_access_logging?: boolean
          enable_digital_signature?: boolean
          enable_tab_permissions?: boolean
          enforce_consent_before_care?: boolean
          id?: string
          lock_record_without_consent?: boolean
          log_retention_days?: number | null
          require_consent_on_registration?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_security_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultation_access_tokens: {
        Row: {
          appointment_id: string
          clinic_id: string
          created_at: string
          expires_at: string
          first_used_at: string | null
          id: string
          last_used_at: string | null
          metadata: Json
          revoked_at: string | null
          revoked_reason: string | null
          target_actor: string
          teleconsultation_session_id: string | null
          token: string
          token_type: string
        }
        Insert: {
          appointment_id: string
          clinic_id: string
          created_at?: string
          expires_at: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json
          revoked_at?: string | null
          revoked_reason?: string | null
          target_actor: string
          teleconsultation_session_id?: string | null
          token: string
          token_type: string
        }
        Update: {
          appointment_id?: string
          clinic_id?: string
          created_at?: string
          expires_at?: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json
          revoked_at?: string | null
          revoked_reason?: string | null
          target_actor?: string
          teleconsultation_session_id?: string | null
          token?: string
          token_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultation_access_tokens_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_access_tokens_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_access_tokens_teleconsultation_session_id_fkey"
            columns: ["teleconsultation_session_id"]
            isOneToOne: false
            referencedRelation: "teleconsultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultation_events: {
        Row: {
          actor_label: string | null
          actor_type: string
          actor_user_id: string | null
          appointment_id: string
          clinic_id: string
          created_at: string
          event_type: string
          id: string
          patient_id: string | null
          payload: Json
          professional_id: string | null
          teleconsultation_session_id: string
        }
        Insert: {
          actor_label?: string | null
          actor_type: string
          actor_user_id?: string | null
          appointment_id: string
          clinic_id: string
          created_at?: string
          event_type: string
          id?: string
          patient_id?: string | null
          payload?: Json
          professional_id?: string | null
          teleconsultation_session_id: string
        }
        Update: {
          actor_label?: string | null
          actor_type?: string
          actor_user_id?: string | null
          appointment_id?: string
          clinic_id?: string
          created_at?: string
          event_type?: string
          id?: string
          patient_id?: string | null
          payload?: Json
          professional_id?: string | null
          teleconsultation_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultation_events_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_events_teleconsultation_session_id_fkey"
            columns: ["teleconsultation_session_id"]
            isOneToOne: false
            referencedRelation: "teleconsultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultation_files: {
        Row: {
          appointment_id: string
          category: string
          clinic_id: string
          created_at: string
          description: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_active: boolean
          patient_id: string
          precheck_id: string | null
          storage_path: string
          teleconsultation_session_id: string | null
          uploaded_by_actor: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          appointment_id: string
          category?: string
          clinic_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          patient_id: string
          precheck_id?: string | null
          storage_path: string
          teleconsultation_session_id?: string | null
          uploaded_by_actor: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          appointment_id?: string
          category?: string
          clinic_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          patient_id?: string
          precheck_id?: string | null
          storage_path?: string
          teleconsultation_session_id?: string | null
          uploaded_by_actor?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultation_files_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_files_precheck_id_fkey"
            columns: ["precheck_id"]
            isOneToOne: false
            referencedRelation: "teleconsultation_prechecks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_files_teleconsultation_session_id_fkey"
            columns: ["teleconsultation_session_id"]
            isOneToOne: false
            referencedRelation: "teleconsultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultation_prechecks: {
        Row: {
          appointment_id: string
          camera_test_status: string
          clinic_id: string
          completed_at: string | null
          connection_quality: string | null
          connection_test_status: string
          consent_accepted: boolean
          consent_accepted_at: string | null
          consent_required: boolean
          created_at: string
          id: string
          identification_confirmed: boolean
          identification_confirmed_at: string | null
          identification_method: string | null
          microphone_test_status: string
          patient_id: string
          release_reason: string | null
          released_to_join: boolean
          started_at: string | null
          status: string
          technical_notes: string | null
          teleconsultation_session_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          camera_test_status?: string
          clinic_id: string
          completed_at?: string | null
          connection_quality?: string | null
          connection_test_status?: string
          consent_accepted?: boolean
          consent_accepted_at?: string | null
          consent_required?: boolean
          created_at?: string
          id?: string
          identification_confirmed?: boolean
          identification_confirmed_at?: string | null
          identification_method?: string | null
          microphone_test_status?: string
          patient_id: string
          release_reason?: string | null
          released_to_join?: boolean
          started_at?: string | null
          status?: string
          technical_notes?: string | null
          teleconsultation_session_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          camera_test_status?: string
          clinic_id?: string
          completed_at?: string | null
          connection_quality?: string | null
          connection_test_status?: string
          consent_accepted?: boolean
          consent_accepted_at?: string | null
          consent_required?: boolean
          created_at?: string
          id?: string
          identification_confirmed?: boolean
          identification_confirmed_at?: string | null
          identification_method?: string | null
          microphone_test_status?: string
          patient_id?: string
          release_reason?: string | null
          released_to_join?: boolean
          started_at?: string | null
          status?: string
          technical_notes?: string | null
          teleconsultation_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultation_prechecks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_prechecks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_prechecks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_prechecks_teleconsultation_session_id_fkey"
            columns: ["teleconsultation_session_id"]
            isOneToOne: false
            referencedRelation: "teleconsultation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultation_sessions: {
        Row: {
          access_token_patient: string | null
          access_token_professional: string | null
          appointment_id: string
          clinic_id: string
          connection_metadata: Json
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          ended_at: string | null
          external_meeting_id: string | null
          host_url: string | null
          id: string
          join_url_patient: string | null
          join_url_professional: string | null
          patient_id: string
          professional_id: string
          provider: string
          recording_enabled: boolean
          recording_status: string | null
          recording_url: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_token_patient?: string | null
          access_token_professional?: string | null
          appointment_id: string
          clinic_id: string
          connection_metadata?: Json
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          external_meeting_id?: string | null
          host_url?: string | null
          id?: string
          join_url_patient?: string | null
          join_url_professional?: string | null
          patient_id: string
          professional_id: string
          provider: string
          recording_enabled?: boolean
          recording_status?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_token_patient?: string | null
          access_token_professional?: string | null
          appointment_id?: string
          clinic_id?: string
          connection_metadata?: Json
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          external_meeting_id?: string | null
          host_url?: string | null
          id?: string
          join_url_patient?: string | null
          join_url_professional?: string | null
          patient_id?: string
          professional_id?: string
          provider?: string
          recording_enabled?: boolean
          recording_status?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultation_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultation_sessions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultation_settings: {
        Row: {
          allow_recording: boolean | null
          clinic_id: string
          created_at: string | null
          default_provider: string | null
          enabled: boolean | null
          enabled_procedure_ids: string[] | null
          enabled_specialty_ids: string[] | null
          id: string
          late_tolerance_minutes: number | null
          link_send_channels: Json | null
          require_consent: boolean | null
          require_precheck: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_recording?: boolean | null
          clinic_id: string
          created_at?: string | null
          default_provider?: string | null
          enabled?: boolean | null
          enabled_procedure_ids?: string[] | null
          enabled_specialty_ids?: string[] | null
          id?: string
          late_tolerance_minutes?: number | null
          link_send_channels?: Json | null
          require_consent?: boolean | null
          require_precheck?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_recording?: boolean | null
          clinic_id?: string
          created_at?: string | null
          default_provider?: string | null
          enabled?: boolean | null
          enabled_procedure_ids?: string[] | null
          enabled_specialty_ids?: string[] | null
          id?: string
          late_tolerance_minutes?: number | null
          link_send_channels?: Json | null
          require_consent?: boolean | null
          require_precheck?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultation_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      therapeutic_goal_updates: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          new_progress: number | null
          observation: string | null
          old_progress: number | null
          score_value: number | null
          updated_by: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          new_progress?: number | null
          observation?: string | null
          old_progress?: number | null
          score_value?: number | null
          updated_by: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          new_progress?: number | null
          observation?: string | null
          old_progress?: number | null
          score_value?: number | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_goal_updates_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "therapeutic_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      therapeutic_goals: {
        Row: {
          clinic_id: string
          created_at: string
          data: Json | null
          descricao: string | null
          id: string
          meta_type: string | null
          patient_id: string
          professional_id: string | null
          progresso: number | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          meta_type?: string | null
          patient_id: string
          professional_id?: string | null
          progresso?: number | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          meta_type?: string | null
          patient_id?: string
          professional_id?: string | null
          progresso?: number | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_goals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_goals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      therapeutic_plans: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          end_date: string | null
          goals: Json | null
          id: string
          patient_id: string
          professional_id: string
          specialty_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          patient_id: string
          professional_id: string
          specialty_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          patient_id?: string
          professional_id?: string
          specialty_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_plans_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapeutic_plans_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      tiss_guide_items: {
        Row: {
          approved_quantity: number | null
          approved_value: number | null
          created_at: string
          description: string
          execution_date: string | null
          glosa_code: string | null
          glosa_reason: string | null
          glosa_value: number | null
          guide_id: string
          id: string
          item_order: number | null
          procedure_code: string | null
          procedure_id: string | null
          quantity: number
          total_price: number | null
          tuss_code: string | null
          unit_price: number | null
        }
        Insert: {
          approved_quantity?: number | null
          approved_value?: number | null
          created_at?: string
          description: string
          execution_date?: string | null
          glosa_code?: string | null
          glosa_reason?: string | null
          glosa_value?: number | null
          guide_id: string
          id?: string
          item_order?: number | null
          procedure_code?: string | null
          procedure_id?: string | null
          quantity?: number
          total_price?: number | null
          tuss_code?: string | null
          unit_price?: number | null
        }
        Update: {
          approved_quantity?: number | null
          approved_value?: number | null
          created_at?: string
          description?: string
          execution_date?: string | null
          glosa_code?: string | null
          glosa_reason?: string | null
          glosa_value?: number | null
          guide_id?: string
          id?: string
          item_order?: number | null
          procedure_code?: string | null
          procedure_id?: string | null
          quantity?: number
          total_price?: number | null
          tuss_code?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tiss_guide_items_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tiss_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guide_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      tiss_guides: {
        Row: {
          appointment_id: string | null
          authorization_number: string | null
          beneficiary_card_number: string | null
          beneficiary_name: string | null
          clinic_id: string
          created_at: string
          data: Json
          guide_number: string | null
          guide_type: Database["public"]["Enums"]["tiss_guide_type"]
          id: string
          insurance_id: string
          issue_date: string | null
          notes: string | null
          patient_id: string
          patient_insurance_id: string | null
          professional_id: string
          rejection_reason: string | null
          service_date: string | null
          status: Database["public"]["Enums"]["tiss_guide_status"]
          submitted_at: string | null
          tiss_version: string | null
          total_amount: number | null
          total_approved: number | null
          total_glosa: number | null
          total_requested: number | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          authorization_number?: string | null
          beneficiary_card_number?: string | null
          beneficiary_name?: string | null
          clinic_id: string
          created_at?: string
          data?: Json
          guide_number?: string | null
          guide_type: Database["public"]["Enums"]["tiss_guide_type"]
          id?: string
          insurance_id: string
          issue_date?: string | null
          notes?: string | null
          patient_id: string
          patient_insurance_id?: string | null
          professional_id: string
          rejection_reason?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["tiss_guide_status"]
          submitted_at?: string | null
          tiss_version?: string | null
          total_amount?: number | null
          total_approved?: number | null
          total_glosa?: number | null
          total_requested?: number | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          authorization_number?: string | null
          beneficiary_card_number?: string | null
          beneficiary_name?: string | null
          clinic_id?: string
          created_at?: string
          data?: Json
          guide_number?: string | null
          guide_type?: Database["public"]["Enums"]["tiss_guide_type"]
          id?: string
          insurance_id?: string
          issue_date?: string | null
          notes?: string | null
          patient_id?: string
          patient_insurance_id?: string | null
          professional_id?: string
          rejection_reason?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["tiss_guide_status"]
          submitted_at?: string | null
          tiss_version?: string | null
          total_amount?: number | null
          total_approved?: number | null
          total_glosa?: number | null
          total_requested?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiss_guides_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_patient_insurance_id_fkey"
            columns: ["patient_insurance_id"]
            isOneToOne: false
            referencedRelation: "patient_insurances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guides_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_packages: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          paid_amount: number
          patient_id: string
          payment_method: string | null
          procedure_id: string | null
          professional_id: string | null
          status: string
          total_amount: number
          total_sessions: number
          updated_at: string
          used_sessions: number
          valid_until: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          paid_amount?: number
          patient_id: string
          payment_method?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          status?: string
          total_amount: number
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
          valid_until?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string
          payment_method?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          status?: string
          total_amount?: number
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_packages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_packages_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_packages_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audit_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          details: Json
          id: string
          performed_by: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          details?: Json
          id?: string
          performed_by: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          details?: Json
          id?: string
          performed_by?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          clinic_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          clinic_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          clinic_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_clinic_as_staff: {
        Args: { p_clinic_id: string }
        Returns: boolean
      }
      can_access_clinical_content: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      can_access_teleconsultation_session_row: {
        Args: { p_clinic_id: string; p_professional_id: string }
        Returns: boolean
      }
      can_join_teleconsultation: {
        Args: { p_actor: string; p_appointment_id: string }
        Returns: {
          can_join: boolean
          consent_accepted: boolean
          consent_required: boolean
          meeting_status: string
          precheck_status: string
          reason: string
        }[]
      }
      check_slot_available: {
        Args: {
          _clinic_id: string
          _end_time: string
          _professional_id: string
          _scheduled_date: string
          _start_time: string
        }
        Returns: boolean
      }
      clinic_specialty_summary: { Args: { _clinic_id: string }; Returns: Json }
      current_professional_id_for_clinic: {
        Args: { p_clinic_id: string }
        Returns: string
      }
      current_user_role_for_clinic: {
        Args: { p_clinic_id: string }
        Returns: string
      }
      deactivate_specialty: {
        Args: { _clinic_id: string; _specialty_slug: string }
        Returns: Json
      }
      find_or_create_public_patient: {
        Args: {
          _birth_date?: string
          _clinic_id: string
          _cpf?: string
          _email?: string
          _full_name: string
          _phone: string
        }
        Returns: string
      }
      generate_quote_number: { Args: { p_clinic_id: string }; Returns: string }
      generate_secure_token: { Args: { p_length?: number }; Returns: string }
      generate_teleconsultation_token: {
        Args: {
          p_actor: string
          p_appointment_id: string
          p_expiration_minutes?: number
          p_token_type: string
        }
        Returns: string
      }
      get_booked_slots: {
        Args: {
          _clinic_id: string
          _date_end: string
          _date_start: string
          _professional_id: string
        }
        Returns: {
          end_time: string
          scheduled_date: string
          start_time: string
        }[]
      }
      get_next_document_number: {
        Args: { p_clinic_id: string }
        Returns: number
      }
      get_pre_registration_by_token: { Args: { _token: string }; Returns: Json }
      get_user_all_permissions: {
        Args: { _user_id: string }
        Returns: {
          actions: Database["public"]["Enums"]["app_action"][]
          module: Database["public"]["Enums"]["app_module"]
          restrictions: Json
        }[]
      }
      get_user_clinic_id_for_rls: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_admin: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      is_recepcionista: { Args: { _user_id?: string }; Returns: boolean }
      log_teleconsultation_event: {
        Args: {
          p_actor_label?: string
          p_actor_type?: string
          p_actor_user_id?: string
          p_appointment_id: string
          p_event_type: string
          p_patient_id?: string
          p_payload?: Json
          p_professional_id?: string
          p_teleconsultation_session_id: string
        }
        Returns: string
      }
      provision_estetica_anamnesis_templates: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: number
      }
      provision_fisioterapia_anamnesis_templates: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: number
      }
      provision_nutricao_anamnesis_templates: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: number
      }
      provision_pilates_anamnesis_templates: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: number
      }
      provision_psicologia_anamnesis_templates: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: number
      }
      provision_specialty: {
        Args: { _clinic_id: string; _specialty_slug: string }
        Returns: undefined
      }
      seed_default_payment_methods: {
        Args: { _clinic_id: string }
        Returns: undefined
      }
      submit_pre_registration: {
        Args: { _data: Json; _token: string }
        Returns: Json
      }
      sync_appointment_teleconsultation_status: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      user_clinic_id: { Args: { _user_id: string }; Returns: string }
      user_has_module_permission: {
        Args: {
          _action?: Database["public"]["Enums"]["app_action"]
          _module: Database["public"]["Enums"]["app_module"]
          _user_id: string
        }
        Returns: boolean
      }
      user_professional_id: { Args: { _user_id: string }; Returns: string }
      validate_clinical_document: { Args: { p_code: string }; Returns: Json }
      validate_teleconsultation_token: {
        Args: { p_token: string; p_token_type: string }
        Returns: {
          appointment_id: string
          clinic_id: string
          expires_at: string
          is_valid: boolean
          revoked_at: string
          target_actor: string
          teleconsultation_session_id: string
        }[]
      }
    }
    Enums: {
      app_action: "view" | "create" | "edit" | "delete" | "export"
      app_module:
        | "dashboard"
        | "agenda"
        | "pacientes"
        | "prontuario"
        | "comunicacao"
        | "financeiro"
        | "convenios"
        | "estoque"
        | "relatorios"
        | "configuracoes"
        | "meu_financeiro"
        | "comercial"
      app_role: "owner" | "admin" | "profissional" | "recepcionista"
      consent_status: "granted" | "revoked" | "pending"
      document_status: "rascunho" | "assinado" | "cancelado"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      product_type: "material_clinico" | "insumo" | "item_venda" | "medicamento"
      stock_movement_type:
        | "entrada"
        | "saida"
        | "ajuste"
        | "consumo_procedimento"
        | "venda"
        | "devolucao"
      tiss_guide_status:
        | "rascunho"
        | "enviada"
        | "autorizada"
        | "negada"
        | "paga"
        | "glosada"
      tiss_guide_type:
        | "consulta"
        | "sadt"
        | "internacao"
        | "honorarios"
        | "odontologica"
      transaction_status: "pendente" | "pago" | "cancelado" | "estornado"
      transaction_type: "receita" | "despesa"
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
      app_action: ["view", "create", "edit", "delete", "export"],
      app_module: [
        "dashboard",
        "agenda",
        "pacientes",
        "prontuario",
        "comunicacao",
        "financeiro",
        "convenios",
        "estoque",
        "relatorios",
        "configuracoes",
        "meu_financeiro",
        "comercial",
      ],
      app_role: ["owner", "admin", "profissional", "recepcionista"],
      consent_status: ["granted", "revoked", "pending"],
      document_status: ["rascunho", "assinado", "cancelado"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      product_type: ["material_clinico", "insumo", "item_venda", "medicamento"],
      stock_movement_type: [
        "entrada",
        "saida",
        "ajuste",
        "consumo_procedimento",
        "venda",
        "devolucao",
      ],
      tiss_guide_status: [
        "rascunho",
        "enviada",
        "autorizada",
        "negada",
        "paga",
        "glosada",
      ],
      tiss_guide_type: [
        "consulta",
        "sadt",
        "internacao",
        "honorarios",
        "odontologica",
      ],
      transaction_status: ["pendente", "pago", "cancelado", "estornado"],
      transaction_type: ["receita", "despesa"],
    },
  },
} as const
