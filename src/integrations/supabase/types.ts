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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          id: string
          ip_address: string | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
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
      aesthetic_before_after: {
        Row: {
          after_image_date: string | null
          after_image_url: string | null
          appointment_id: string | null
          before_image_date: string | null
          before_image_url: string | null
          clinic_id: string
          consent_for_marketing: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          patient_id: string
          procedure_id: string | null
          procedure_type: string | null
          title: string
          updated_at: string
          view_angle: string | null
        }
        Insert: {
          after_image_date?: string | null
          after_image_url?: string | null
          appointment_id?: string | null
          before_image_date?: string | null
          before_image_url?: string | null
          clinic_id: string
          consent_for_marketing?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id: string
          procedure_id?: string | null
          procedure_type?: string | null
          title: string
          updated_at?: string
          view_angle?: string | null
        }
        Update: {
          after_image_date?: string | null
          after_image_url?: string | null
          appointment_id?: string | null
          before_image_date?: string | null
          before_image_url?: string | null
          clinic_id?: string
          consent_for_marketing?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id?: string
          procedure_id?: string | null
          procedure_type?: string | null
          title?: string
          updated_at?: string
          view_angle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aesthetic_before_after_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_before_after_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_before_after_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_before_after_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      aesthetic_consent_records: {
        Row: {
          accepted_at: string
          appointment_id: string | null
          clinic_id: string
          consent_type: string
          created_by: string | null
          facial_map_id: string | null
          id: string
          ip_address: string | null
          patient_id: string
          procedure_id: string | null
          procedure_name: string | null
          signature_data: string | null
          term_content: string
          term_title: string
          term_version: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          appointment_id?: string | null
          clinic_id: string
          consent_type: string
          created_by?: string | null
          facial_map_id?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          procedure_id?: string | null
          procedure_name?: string | null
          signature_data?: string | null
          term_content: string
          term_title: string
          term_version?: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          appointment_id?: string | null
          clinic_id?: string
          consent_type?: string
          created_by?: string | null
          facial_map_id?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          procedure_id?: string | null
          procedure_name?: string | null
          signature_data?: string | null
          term_content?: string
          term_title?: string
          term_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aesthetic_consent_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_consent_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_consent_records_facial_map_id_fkey"
            columns: ["facial_map_id"]
            isOneToOne: false
            referencedRelation: "facial_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_consent_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_consent_records_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      aesthetic_products_used: {
        Row: {
          application_area: string | null
          appointment_id: string | null
          batch_number: string | null
          clinic_id: string
          created_at: string
          expiry_date: string | null
          facial_map_id: string | null
          id: string
          manufacturer: string | null
          notes: string | null
          patient_id: string
          procedure_description: string | null
          procedure_type: string | null
          product_name: string
          quantity: number
          registered_at: string
          registered_by: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          application_area?: string | null
          appointment_id?: string | null
          batch_number?: string | null
          clinic_id: string
          created_at?: string
          expiry_date?: string | null
          facial_map_id?: string | null
          id?: string
          manufacturer?: string | null
          notes?: string | null
          patient_id: string
          procedure_description?: string | null
          procedure_type?: string | null
          product_name: string
          quantity?: number
          registered_at?: string
          registered_by?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          application_area?: string | null
          appointment_id?: string | null
          batch_number?: string | null
          clinic_id?: string
          created_at?: string
          expiry_date?: string | null
          facial_map_id?: string | null
          id?: string
          manufacturer?: string | null
          notes?: string | null
          patient_id?: string
          procedure_description?: string | null
          procedure_type?: string | null
          product_name?: string
          quantity?: number
          registered_at?: string
          registered_by?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aesthetic_products_used_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_products_used_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_products_used_facial_map_id_fkey"
            columns: ["facial_map_id"]
            isOneToOne: false
            referencedRelation: "facial_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aesthetic_products_used_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_record_patients: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          record_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          record_id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          record_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_record_patients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_record_patients_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_records"
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
          id: string
          patient_id: string
          procedure_id: string | null
          responses: Json
          specialty_id: string | null
          structure_snapshot: Json | null
          template_id: string
          template_version_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          procedure_id?: string | null
          responses?: Json
          specialty_id?: string | null
          structure_snapshot?: Json | null
          template_id: string
          template_version_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          procedure_id?: string | null
          responses?: Json
          specialty_id?: string | null
          structure_snapshot?: Json | null
          template_id?: string
          template_version_id?: string
          updated_at?: string
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
            foreignKeyName: "anamnesis_records_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
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
          id: string
          structure: Json
          template_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          structure?: Json
          template_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          structure?: Json
          template_id?: string
          version_number?: number
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
          archived_at: string | null
          archived_by: string | null
          campos: Json
          clinic_id: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_system: boolean
          name: string
          procedure_id: string | null
          specialty: string | null
          specialty_id: string | null
          template_type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          campos?: Json
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name: string
          procedure_id?: string | null
          specialty?: string | null
          specialty_id?: string | null
          template_type: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          campos?: Json
          clinic_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name?: string
          procedure_id?: string | null
          specialty?: string | null
          specialty_id?: string | null
          template_type?: string
          updated_at?: string
          usage_count?: number
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
            foreignKeyName: "anamnesis_templates_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnesis_templates_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
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
      appointment_rules: {
        Row: {
          arrival_tolerance_minutes: number
          clinic_id: string
          confirmation_advance_hours: number
          created_at: string
          id: string
          max_reschedules: number
          min_advance_hours: number
          updated_at: string
        }
        Insert: {
          arrival_tolerance_minutes?: number
          clinic_id: string
          confirmation_advance_hours?: number
          created_at?: string
          id?: string
          max_reschedules?: number
          min_advance_hours?: number
          updated_at?: string
        }
        Update: {
          arrival_tolerance_minutes?: number
          clinic_id?: string
          confirmation_advance_hours?: number
          created_at?: string
          id?: string
          max_reschedules?: number
          min_advance_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_statuses: {
        Row: {
          clinic_id: string
          color: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
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
          color: string
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
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
          appointment_type: string
          arrived_at: string | null
          cancellation_reason: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
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
          notes: string | null
          patient_id: string
          payment_type: string | null
          procedure_cost: number | null
          procedure_id: string | null
          professional_id: string
          room_id: string | null
          scheduled_date: string
          specialty_id: string | null
          start_time: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_type?: string
          arrived_at?: string | null
          cancellation_reason?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
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
          notes?: string | null
          patient_id: string
          payment_type?: string | null
          procedure_cost?: number | null
          procedure_id?: string | null
          professional_id: string
          room_id?: string | null
          scheduled_date: string
          specialty_id?: string | null
          start_time: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_type?: string
          arrived_at?: string | null
          cancellation_reason?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
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
          notes?: string | null
          patient_id?: string
          payment_type?: string | null
          procedure_cost?: number | null
          procedure_id?: string | null
          professional_id?: string
          room_id?: string | null
          scheduled_date?: string
          specialty_id?: string | null
          start_time?: string
          started_at?: string | null
          status?: string
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
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
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
          channel: string
          clinic_id: string
          created_at: string
          created_by: string | null
          delay_type: string
          delay_value: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          template_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          channel?: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          delay_type?: string
          delay_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          template_id?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          channel?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          delay_type?: string
          delay_value?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          template_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
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
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          after_date: string | null
          after_image_url: string | null
          appointment_id: string | null
          before_date: string
          before_image_url: string
          clinic_id: string
          consent_for_marketing: boolean
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_consent_given: boolean
          patient_id: string
          procedure_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          after_date?: string | null
          after_image_url?: string | null
          appointment_id?: string | null
          before_date: string
          before_image_url: string
          clinic_id: string
          consent_for_marketing?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_consent_given?: boolean
          patient_id: string
          procedure_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          after_date?: string | null
          after_image_url?: string | null
          appointment_id?: string | null
          before_date?: string
          before_image_url?: string
          clinic_id?: string
          consent_for_marketing?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_consent_given?: boolean
          patient_id?: string
          procedure_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "before_after_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
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
            foreignKeyName: "before_after_records_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          appointment_id: string | null
          arm_left_cm: number | null
          arm_right_cm: number | null
          bmi: number | null
          body_fat_percent: number | null
          calf_left_cm: number | null
          calf_right_cm: number | null
          chest_cm: number | null
          clinic_id: string
          created_at: string
          custom_measurements: Json | null
          height_cm: number | null
          hip_cm: number | null
          id: string
          measurement_date: string
          muscle_mass_kg: number | null
          notes: string | null
          patient_id: string
          recorded_by: string
          thigh_left_cm: number | null
          thigh_right_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          appointment_id?: string | null
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          bmi?: number | null
          body_fat_percent?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          chest_cm?: number | null
          clinic_id: string
          created_at?: string
          custom_measurements?: Json | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          patient_id: string
          recorded_by: string
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          appointment_id?: string | null
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          bmi?: number | null
          body_fat_percent?: number | null
          calf_left_cm?: number | null
          calf_right_cm?: number | null
          chest_cm?: number | null
          clinic_id?: string
          created_at?: string
          custom_measurements?: Json | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          patient_id?: string
          recorded_by?: string
          thigh_left_cm?: number | null
          thigh_right_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
        ]
      }
      clinic_audit_logs: {
        Row: {
          action: string
          changes: Json
          clinic_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          changes: Json
          clinic_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json
          clinic_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
          created_at: string
          display_phone_number: string | null
          id: string
          instance_id: string | null
          metadata: Json | null
          phone_number_id: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          api_url?: string | null
          base_url?: string | null
          business_account_id?: string | null
          channel?: string
          clinic_id: string
          created_at?: string
          display_phone_number?: string | null
          id?: string
          instance_id?: string | null
          metadata?: Json | null
          phone_number_id?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          api_url?: string | null
          base_url?: string | null
          business_account_id?: string | null
          channel?: string
          clinic_id?: string
          created_at?: string
          display_phone_number?: string | null
          id?: string
          instance_id?: string | null
          metadata?: Json | null
          phone_number_id?: string | null
          provider?: string
          status?: string
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
          id: string
          last_number: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          id?: string
          last_number?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          id?: string
          last_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_document_counter_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
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
          doc_type_config: Json | null
          font_family: string | null
          footer_text: string | null
          header_layout: string | null
          header_style: string
          id: string
          logo_url: string | null
          primary_color: string
          responsible_crm: string | null
          responsible_name: string | null
          secondary_color: string
          show_crm: boolean
          show_digital_signature: boolean
          show_footer: boolean
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
          doc_type_config?: Json | null
          font_family?: string | null
          footer_text?: string | null
          header_layout?: string | null
          header_style?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          responsible_crm?: string | null
          responsible_name?: string | null
          secondary_color?: string
          show_crm?: boolean
          show_digital_signature?: boolean
          show_footer?: boolean
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
          doc_type_config?: Json | null
          font_family?: string | null
          footer_text?: string | null
          header_layout?: string | null
          header_style?: string
          id?: string
          logo_url?: string | null
          primary_color?: string
          responsible_crm?: string | null
          responsible_name?: string | null
          secondary_color?: string
          show_crm?: boolean
          show_digital_signature?: boolean
          show_footer?: boolean
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
            isOneToOne: true
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
          id: string
          is_enabled: boolean
          module_id: string
          specialty_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clinic_id: string
          id?: string
          is_enabled?: boolean
          module_id: string
          specialty_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clinic_id?: string
          id?: string
          is_enabled?: boolean
          module_id?: string
          specialty_id?: string
          updated_at?: string
          updated_by?: string | null
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
            foreignKeyName: "clinic_specialty_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "clinical_modules"
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
      clinical_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          patient_id: string
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          patient_id: string
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
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
            foreignKeyName: "clinical_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      clinical_appointment_images: {
        Row: {
          appointment_id: string
          caption: string | null
          classification: string
          clinic_id: string
          created_at: string
          field_id: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          patient_id: string
          taken_at: string
          template_id: string | null
          template_version_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          appointment_id: string
          caption?: string | null
          classification?: string
          clinic_id: string
          created_at?: string
          field_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          patient_id: string
          taken_at?: string
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          appointment_id?: string
          caption?: string | null
          classification?: string
          clinic_id?: string
          created_at?: string
          field_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          patient_id?: string
          taken_at?: string
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_appointment_images_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_appointment_images_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_appointment_images_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "medical_record_tab_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_appointment_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_appointment_images_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_appointment_images_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_documents: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          document_hash: string
          document_reference: string
          document_type: Database["public"]["Enums"]["clinical_document_type"]
          id: string
          is_revoked: boolean
          patient_id: string
          patient_name: string | null
          pdf_url: string | null
          professional_name: string | null
          replaced_by_document_id: string | null
          replaces_document_id: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          source_record_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          document_hash: string
          document_reference: string
          document_type: Database["public"]["Enums"]["clinical_document_type"]
          id?: string
          is_revoked?: boolean
          patient_id: string
          patient_name?: string | null
          pdf_url?: string | null
          professional_name?: string | null
          replaced_by_document_id?: string | null
          replaces_document_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          source_record_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          document_hash?: string
          document_reference?: string
          document_type?: Database["public"]["Enums"]["clinical_document_type"]
          id?: string
          is_revoked?: boolean
          patient_id?: string
          patient_name?: string | null
          pdf_url?: string | null
          professional_name?: string | null
          replaced_by_document_id?: string | null
          replaces_document_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          source_record_id?: string | null
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
          evolution_type: string
          id: string
          next_steps: string | null
          notes: string | null
          patient_id: string
          procedure_id: string | null
          professional_id: string
          signed_at: string | null
          signed_by: string | null
          specialty: string | null
          specialty_id: string | null
          status: string
          structure_snapshot: Json | null
          template_id: string | null
          template_version_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          content?: Json
          created_at?: string
          evolution_type?: string
          id?: string
          next_steps?: string | null
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          professional_id: string
          signed_at?: string | null
          signed_by?: string | null
          specialty?: string | null
          specialty_id?: string | null
          status?: string
          structure_snapshot?: Json | null
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          content?: Json
          created_at?: string
          evolution_type?: string
          id?: string
          next_steps?: string | null
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          professional_id?: string
          signed_at?: string | null
          signed_by?: string | null
          specialty?: string | null
          specialty_id?: string | null
          status?: string
          structure_snapshot?: Json | null
          template_id?: string | null
          template_version_id?: string | null
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
            foreignKeyName: "clinical_evolutions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
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
          {
            foreignKeyName: "clinical_evolutions_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_media: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          evolution_id: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          is_consent_given: boolean
          media_type: string
          metadata: Json | null
          patient_id: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          uploaded_by: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          evolution_id?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          is_consent_given?: boolean
          media_type: string
          metadata?: Json | null
          patient_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_by: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          evolution_id?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          is_consent_given?: boolean
          media_type?: string
          metadata?: Json | null
          patient_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_media_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_media_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_media_evolution_id_fkey"
            columns: ["evolution_id"]
            isOneToOne: false
            referencedRelation: "clinical_evolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_media_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_modules: {
        Row: {
          category: Database["public"]["Enums"]["clinical_module_category"]
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_system: boolean
          key: string
          name: string
        }
        Insert: {
          category: Database["public"]["Enums"]["clinical_module_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["clinical_module_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
          allow_negative_stock: boolean
          auto_material_consumption: boolean | null
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
          max_automations: number
          monthly_goal: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          primary_specialty_id: string | null
          updated_at: string
          updated_by: string | null
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
          allow_negative_stock?: boolean
          auto_material_consumption?: boolean | null
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
          max_automations?: number
          monthly_goal?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          primary_specialty_id?: string | null
          updated_at?: string
          updated_by?: string | null
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
          allow_negative_stock?: boolean
          auto_material_consumption?: boolean | null
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
          max_automations?: number
          monthly_goal?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          primary_specialty_id?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_primary_specialty_id_fkey"
            columns: ["primary_specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_settings: {
        Row: {
          clinic_id: string
          created_at: string
          daily_message_limit: number | null
          default_channel: string | null
          id: string
          send_end_time: string | null
          send_on_weekends: boolean | null
          send_start_time: string | null
          updated_at: string
          whatsapp_connected: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          daily_message_limit?: number | null
          default_channel?: string | null
          id?: string
          send_end_time?: string | null
          send_on_weekends?: boolean | null
          send_start_time?: string | null
          updated_at?: string
          whatsapp_connected?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          daily_message_limit?: number | null
          default_channel?: string | null
          id?: string
          send_end_time?: string | null
          send_on_weekends?: boolean | null
          send_start_time?: string | null
          updated_at?: string
          whatsapp_connected?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
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
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          clinic_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_term_id?: string | null
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          clinic_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_term_id?: string | null
          title?: string
          updated_at?: string
          version?: string
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
      crm_patient_status: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          last_contact_at: string | null
          notes: string | null
          opt_out_date: string | null
          opt_out_messages: boolean | null
          patient_id: string
          preferred_contact: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          opt_out_date?: string | null
          opt_out_messages?: boolean | null
          patient_id: string
          preferred_contact?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          opt_out_date?: string | null
          opt_out_messages?: boolean | null
          patient_id?: string
          preferred_contact?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_patient_status_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_patient_status_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          evolution_id: string | null
          field_id: string
          id: string
          patient_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          evolution_id?: string | null
          field_id: string
          id?: string
          patient_id: string
          updated_at?: string
          value: Json
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          evolution_id?: string | null
          field_id?: string
          id?: string
          patient_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_evolution_id_fkey"
            columns: ["evolution_id"]
            isOneToOne: false
            referencedRelation: "clinical_evolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_prontuario_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_prontuario_fields: {
        Row: {
          all_appointments: boolean
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          name: string
          options: Json | null
          placeholder: string | null
          procedure_id: string | null
          specialty_id: string | null
          updated_at: string
        }
        Insert: {
          all_appointments?: boolean
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          field_type: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name: string
          options?: Json | null
          placeholder?: string | null
          procedure_id?: string | null
          specialty_id?: string | null
          updated_at?: string
        }
        Update: {
          all_appointments?: boolean
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          name?: string
          options?: Json | null
          placeholder?: string | null
          procedure_id?: string | null
          specialty_id?: string | null
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
          assinatura_url: string | null
          bloqueado: boolean | null
          cancelado_em: string | null
          cancelado_por: string | null
          clinic_id: string
          conteudo_json: Json
          created_at: string
          id: string
          modelo_id: string | null
          motivo_cancelamento: string | null
          numero_talonario: string | null
          patient_id: string
          pdf_url: string | null
          professional_id: string
          qr_hash: string | null
          specialty_id: string | null
          status: string
          tipo: string
          tipo_receita: string | null
          updated_at: string
        }
        Insert: {
          assinatura_url?: string | null
          bloqueado?: boolean | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          clinic_id: string
          conteudo_json?: Json
          created_at?: string
          id?: string
          modelo_id?: string | null
          motivo_cancelamento?: string | null
          numero_talonario?: string | null
          patient_id: string
          pdf_url?: string | null
          professional_id: string
          qr_hash?: string | null
          specialty_id?: string | null
          status?: string
          tipo: string
          tipo_receita?: string | null
          updated_at?: string
        }
        Update: {
          assinatura_url?: string | null
          bloqueado?: boolean | null
          cancelado_em?: string | null
          cancelado_por?: string | null
          clinic_id?: string
          conteudo_json?: Json
          created_at?: string
          id?: string
          modelo_id?: string | null
          motivo_cancelamento?: string | null
          numero_talonario?: string | null
          patient_id?: string
          pdf_url?: string | null
          professional_id?: string
          qr_hash?: string | null
          specialty_id?: string | null
          status?: string
          tipo?: string
          tipo_receita?: string | null
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
          {
            foreignKeyName: "documentos_clinicos_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documentos_clinicos_modelo"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_documento"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_log: {
        Row: {
          acao: string
          data_hora: string
          documento_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          data_hora?: string
          documento_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          data_hora?: string
          documento_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_log_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_clinicos"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_map_applications: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          facial_map_id: string | null
          id: string
          muscle: string | null
          notes: string | null
          patient_id: string
          position_x: number
          position_y: number
          procedure_type: string
          product_name: string
          professional_id: string | null
          quantity: number
          side: string | null
          unit: string
          updated_at: string
          view_type: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          facial_map_id?: string | null
          id?: string
          muscle?: string | null
          notes?: string | null
          patient_id: string
          position_x: number
          position_y: number
          procedure_type: string
          product_name: string
          professional_id?: string | null
          quantity: number
          side?: string | null
          unit?: string
          updated_at?: string
          view_type?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          facial_map_id?: string | null
          id?: string
          muscle?: string | null
          notes?: string | null
          patient_id?: string
          position_x?: number
          position_y?: number
          procedure_type?: string
          product_name?: string
          professional_id?: string | null
          quantity?: number
          side?: string | null
          unit?: string
          updated_at?: string
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "facial_map_applications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_map_applications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_map_applications_facial_map_id_fkey"
            columns: ["facial_map_id"]
            isOneToOne: false
            referencedRelation: "facial_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_map_applications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_map_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_map_images: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          facial_map_id: string
          id: string
          image_date: string | null
          image_type: string
          image_url: string
          notes: string | null
          updated_at: string
          view_angle: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          facial_map_id: string
          id?: string
          image_date?: string | null
          image_type: string
          image_url: string
          notes?: string | null
          updated_at?: string
          view_angle?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          facial_map_id?: string
          id?: string
          image_date?: string | null
          image_type?: string
          image_url?: string
          notes?: string | null
          updated_at?: string
          view_angle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facial_map_images_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
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
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          general_notes: string | null
          id: string
          map_type: string
          patient_id: string
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          general_notes?: string | null
          id?: string
          map_type?: string
          patient_id: string
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          general_notes?: string | null
          id?: string
          map_type?: string
          patient_id?: string
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facial_maps_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
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
          id: string
          insurance_id: string | null
          notes: string | null
          origin: string | null
          patient_id: string | null
          payment_method: string | null
          professional_id: string | null
          transaction_date: string
          type: string
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
          id?: string
          insurance_id?: string | null
          notes?: string | null
          origin?: string | null
          patient_id?: string | null
          payment_method?: string | null
          professional_id?: string | null
          transaction_date?: string
          type: string
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
          id?: string
          insurance_id?: string | null
          notes?: string | null
          origin?: string | null
          patient_id?: string | null
          payment_method?: string | null
          professional_id?: string | null
          transaction_date?: string
          type?: string
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
            foreignKeyName: "finance_transactions_insurance_id_fkey"
            columns: ["insurance_id"]
            isOneToOne: false
            referencedRelation: "insurances"
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
          clinic_id: string
          created_at: string
          enabled: boolean
          id: string
          min_continuous_minutes: number
          min_idle_hours: number
          min_occupancy_percent: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          min_continuous_minutes?: number
          min_idle_hours?: number
          min_occupancy_percent?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          min_continuous_minutes?: number
          min_idle_hours?: number
          min_occupancy_percent?: number
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
          clinic_id: string
          created_at: string
          data_aplicacao: string
          documento_nome: string | null
          documento_url: string | null
          finalidade: string | null
          id: string
          nome_instrumento: string
          observacoes: string | null
          patient_id: string
          profissional_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data_aplicacao?: string
          documento_nome?: string | null
          documento_url?: string | null
          finalidade?: string | null
          id?: string
          nome_instrumento: string
          observacoes?: string | null
          patient_id: string
          profissional_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data_aplicacao?: string
          documento_nome?: string | null
          documento_url?: string | null
          finalidade?: string | null
          id?: string
          nome_instrumento?: string
          observacoes?: string | null
          patient_id?: string
          profissional_id?: string
          updated_at?: string
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
          appointment_id: string | null
          authorization_date: string
          authorization_number: string
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          insurance_id: string
          notes: string | null
          patient_id: string
          procedure_id: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          appointment_id?: string | null
          authorization_date?: string
          authorization_number: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          insurance_id: string
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          appointment_id?: string | null
          authorization_date?: string
          authorization_number?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          insurance_id?: string
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_authorizations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
          clinic_id: string
          clinic_net_value: number
          created_at: string
          created_by: string | null
          fee_fixed_value: number | null
          fee_percentage: number | null
          fee_type: string
          gross_value: number
          guide_id: string | null
          id: string
          insurance_id: string
          notes: string | null
          patient_id: string | null
          payment_date: string | null
          payment_due_date: string | null
          professional_fee: number
          professional_id: string | null
          reference_period: string | null
          service_date: string
          status: Database["public"]["Enums"]["fee_calculation_status"]
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          clinic_net_value?: number
          created_at?: string
          created_by?: string | null
          fee_fixed_value?: number | null
          fee_percentage?: number | null
          fee_type?: string
          gross_value?: number
          guide_id?: string | null
          id?: string
          insurance_id: string
          notes?: string | null
          patient_id?: string | null
          payment_date?: string | null
          payment_due_date?: string | null
          professional_fee?: number
          professional_id?: string | null
          reference_period?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["fee_calculation_status"]
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          clinic_net_value?: number
          created_at?: string
          created_by?: string | null
          fee_fixed_value?: number | null
          fee_percentage?: number | null
          fee_type?: string
          gross_value?: number
          guide_id?: string | null
          id?: string
          insurance_id?: string
          notes?: string | null
          patient_id?: string | null
          payment_date?: string | null
          payment_due_date?: string | null
          professional_fee?: number
          professional_id?: string | null
          reference_period?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["fee_calculation_status"]
          updated_at?: string
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
          clinic_id: string
          created_at: string
          description: string | null
          fee_type: string
          fee_value: number
          id: string
          insurance_id: string
          is_active: boolean
          payment_deadline_days: number | null
          procedure_id: string | null
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          fee_type?: string
          fee_value: number
          id?: string
          insurance_id: string
          is_active?: boolean
          payment_deadline_days?: number | null
          procedure_id?: string | null
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          fee_type?: string
          fee_value?: number
          id?: string
          insurance_id?: string
          is_active?: boolean
          payment_deadline_days?: number | null
          procedure_id?: string | null
          professional_id?: string | null
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
          clinic_id: string
          covered_value: number | null
          created_at: string
          id: string
          insurance_id: string
          is_active: boolean
          notes: string | null
          procedure_id: string
          requires_authorization: boolean | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          covered_value?: number | null
          created_at?: string
          id?: string
          insurance_id: string
          is_active?: boolean
          notes?: string | null
          procedure_id: string
          requires_authorization?: boolean | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          covered_value?: number | null
          created_at?: string
          id?: string
          insurance_id?: string
          is_active?: boolean
          notes?: string | null
          procedure_id?: string
          requires_authorization?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_procedures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
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
          requires_authorization: boolean | null
          return_allowed: boolean | null
          return_days: number | null
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
          requires_authorization?: boolean | null
          return_allowed?: boolean | null
          return_days?: number | null
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
          requires_authorization?: boolean | null
          return_allowed?: boolean | null
          return_days?: number | null
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
          appointment_id: string | null
          clinic_id: string
          created_at: string
          created_by: string
          custom_image_url: string | null
          id: string
          map_type: string
          notes: string | null
          patient_id: string
        }
        Insert: {
          annotations: Json
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          created_by: string
          custom_image_url?: string | null
          id?: string
          map_type: string
          notes?: string | null
          patient_id: string
        }
        Update: {
          annotations?: Json
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string
          custom_image_url?: string | null
          id?: string
          map_type?: string
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactive_map_annotations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
        ]
      }
      marketing_campaigns: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          delivered_count: number | null
          description: string | null
          error_count: number | null
          id: string
          name: string
          read_count: number | null
          scheduled_at: string | null
          segment_config: Json
          sent_at: string | null
          sent_count: number | null
          status: string
          template_id: string | null
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          error_count?: number | null
          id?: string
          name: string
          read_count?: number | null
          scheduled_at?: string | null
          segment_config?: Json
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          error_count?: number | null
          id?: string
          name?: string
          read_count?: number | null
          scheduled_at?: string | null
          segment_config?: Json
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      material_consumption: {
        Row: {
          appointment_id: string
          clinic_id: string
          consumed_at: string
          consumption_type: string
          created_at: string
          created_by: string | null
          id: string
          kit_id: string | null
          material_id: string
          notes: string | null
          patient_id: string | null
          procedure_id: string | null
          professional_id: string | null
          quantity: number
          source: string
          total_cost: number | null
          unit: string
          unit_cost: number | null
        }
        Insert: {
          appointment_id: string
          clinic_id: string
          consumed_at?: string
          consumption_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kit_id?: string | null
          material_id: string
          notes?: string | null
          patient_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number
          source?: string
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
        }
        Update: {
          appointment_id?: string
          clinic_id?: string
          consumed_at?: string
          consumption_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          kit_id?: string | null
          material_id?: string
          notes?: string | null
          patient_id?: string | null
          procedure_id?: string | null
          professional_id?: string | null
          quantity?: number
          source?: string
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
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
            foreignKeyName: "material_consumption_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "material_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_consumption_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
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
            foreignKeyName: "material_consumption_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
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
          material_id: string
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          kit_id: string
          material_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          kit_id?: string
          material_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "material_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_kit_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_kits: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_kits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          clinic_id: string
          created_at: string
          current_stock: number | null
          description: string | null
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          clinic_id: string
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          clinic_id?: string
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_attachments: {
        Row: {
          before_after_type: string | null
          category: string
          clinic_id: string
          created_at: string
          description: string | null
          evolution_id: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_before_after: boolean | null
          patient_id: string
          uploaded_by: string | null
        }
        Insert: {
          before_after_type?: string | null
          category?: string
          clinic_id: string
          created_at?: string
          description?: string | null
          evolution_id?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_before_after?: boolean | null
          patient_id: string
          uploaded_by?: string | null
        }
        Update: {
          before_after_type?: string | null
          category?: string
          clinic_id?: string
          created_at?: string
          description?: string | null
          evolution_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_before_after?: boolean | null
          patient_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_attachments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_attachments_evolution_id_fkey"
            columns: ["evolution_id"]
            isOneToOne: false
            referencedRelation: "clinical_evolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      medical_record_attachment_config: {
        Row: {
          allowed_file_types: Json
          clinic_id: string
          created_at: string
          id: string
          max_file_size_mb: number
          updated_at: string
        }
        Insert: {
          allowed_file_types?: Json
          clinic_id: string
          created_at?: string
          id?: string
          max_file_size_mb?: number
          updated_at?: string
        }
        Update: {
          allowed_file_types?: Json
          clinic_id?: string
          created_at?: string
          id?: string
          max_file_size_mb?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_attachment_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_audit_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          patient_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          patient_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          patient_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_audit_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_entries: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          content: Json
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          next_steps: string | null
          notes: string | null
          patient_id: string
          procedure_id: string | null
          professional_id: string
          signed_at: string | null
          signed_by: string | null
          specialty_id: string | null
          status: string
          structure_snapshot: Json | null
          template_id: string | null
          template_version_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          content?: Json
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          next_steps?: string | null
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          professional_id: string
          signed_at?: string | null
          signed_by?: string | null
          specialty_id?: string | null
          status?: string
          structure_snapshot?: Json | null
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          next_steps?: string | null
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          professional_id?: string
          signed_at?: string | null
          signed_by?: string | null
          specialty_id?: string | null
          status?: string
          structure_snapshot?: Json | null
          template_id?: string | null
          template_version_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "medical_record_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_entries_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_fields: {
        Row: {
          created_at: string
          field_order: number
          field_type: string
          id: string
          is_required: boolean
          label: string
          options: Json | null
          placeholder: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_order?: number
          field_type: string
          id?: string
          is_required?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "medical_record_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_files: {
        Row: {
          before_after_type: string | null
          category: string
          clinic_id: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_id: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_before_after: boolean | null
          patient_id: string
        }
        Insert: {
          before_after_type?: string | null
          category?: string
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_id?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_before_after?: boolean | null
          patient_id: string
        }
        Update: {
          before_after_type?: string | null
          category?: string
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_before_after?: boolean | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_files_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_files_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "medical_record_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_print_config: {
        Row: {
          clinic_id: string
          created_at: string
          footer_text: string | null
          header_text: string | null
          id: string
          include_footer: boolean
          include_header: boolean
          include_logo: boolean
          include_patient_data: boolean
          include_professional_data: boolean
          margin_bottom_mm: number
          margin_left_mm: number
          margin_right_mm: number
          margin_top_mm: number
          orientation: string
          paper_size: string
          sections_to_print: Json
          updated_at: string
          use_clinic_colors: boolean
        }
        Insert: {
          clinic_id: string
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          include_footer?: boolean
          include_header?: boolean
          include_logo?: boolean
          include_patient_data?: boolean
          include_professional_data?: boolean
          margin_bottom_mm?: number
          margin_left_mm?: number
          margin_right_mm?: number
          margin_top_mm?: number
          orientation?: string
          paper_size?: string
          sections_to_print?: Json
          updated_at?: string
          use_clinic_colors?: boolean
        }
        Update: {
          clinic_id?: string
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          include_footer?: boolean
          include_header?: boolean
          include_logo?: boolean
          include_patient_data?: boolean
          include_professional_data?: boolean
          margin_bottom_mm?: number
          margin_left_mm?: number
          margin_right_mm?: number
          margin_top_mm?: number
          orientation?: string
          paper_size?: string
          sections_to_print?: Json
          updated_at?: string
          use_clinic_colors?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_print_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
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
          require_justification_for_edit: boolean
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
          require_justification_for_edit?: boolean
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
          require_justification_for_edit?: boolean
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
          created_at: string
          document_hash: string
          id: string
          ip_address: string | null
          medical_record_id: string
          patient_id: string
          professional_id: string
          signature_type: string
          signed_at: string
          signed_document: string | null
          signed_name: string
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          document_hash: string
          id?: string
          ip_address?: string | null
          medical_record_id: string
          patient_id: string
          professional_id: string
          signature_type?: string
          signed_at?: string
          signed_document?: string | null
          signed_name: string
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          document_hash?: string
          id?: string
          ip_address?: string | null
          medical_record_id?: string
          patient_id?: string
          professional_id?: string
          signature_type?: string
          signed_at?: string
          signed_document?: string | null
          signed_name?: string
          status?: string
          updated_at?: string
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
          {
            foreignKeyName: "medical_record_signatures_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: true
            referencedRelation: "medical_record_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_signatures_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_signatures_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_tab_fields: {
        Row: {
          clinic_id: string
          condition_field_id: string | null
          condition_operator: string | null
          condition_value: string | null
          created_at: string
          default_value: string | null
          field_order: number
          field_type: string
          id: string
          is_active: boolean
          is_required: boolean
          is_system: boolean
          label: string
          options: Json | null
          placeholder: string | null
          specialty_id: string
          tab_id: string
          updated_at: string
          visible_to_roles: string[] | null
        }
        Insert: {
          clinic_id: string
          condition_field_id?: string | null
          condition_operator?: string | null
          condition_value?: string | null
          created_at?: string
          default_value?: string | null
          field_order?: number
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_system?: boolean
          label: string
          options?: Json | null
          placeholder?: string | null
          specialty_id: string
          tab_id: string
          updated_at?: string
          visible_to_roles?: string[] | null
        }
        Update: {
          clinic_id?: string
          condition_field_id?: string | null
          condition_operator?: string | null
          condition_value?: string | null
          created_at?: string
          default_value?: string | null
          field_order?: number
          field_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          is_system?: boolean
          label?: string
          options?: Json | null
          placeholder?: string | null
          specialty_id?: string
          tab_id?: string
          updated_at?: string
          visible_to_roles?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_tab_fields_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_tab_fields_condition_field_id_fkey"
            columns: ["condition_field_id"]
            isOneToOne: false
            referencedRelation: "medical_record_tab_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_tab_fields_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
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
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          name: string
          professional_id: string | null
          scope: string
          specialty_id: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          name: string
          professional_id?: string | null
          scope?: string
          specialty_id?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          name?: string
          professional_id?: string | null
          scope?: string
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
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_system: boolean
          name: string
          professional_id: string | null
          scope: string
          specialty_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name: string
          professional_id?: string | null
          scope?: string
          specialty_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_system?: boolean
          name?: string
          professional_id?: string | null
          scope?: string
          specialty_id?: string | null
          type?: string
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
            foreignKeyName: "medical_record_templates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
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
          accent_color: string
          clinic_id: string
          created_at: string
          font_size: string
          id: string
          layout: string
          logo_position: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          clinic_id: string
          created_at?: string
          font_size?: string
          id?: string
          layout?: string
          logo_position?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          clinic_id?: string
          created_at?: string
          font_size?: string
          id?: string
          layout?: string
          logo_position?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
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
      medical_records: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_api_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          provider: string
          query_normalizada: string
          response_json: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          query_normalizada: string
          response_json?: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          query_normalizada?: string
          response_json?: Json
        }
        Relationships: []
      }
      medication_api_logs: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          provider: string
          query: string
          response_time_ms: number
          status: string
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          provider: string
          query: string
          response_time_ms?: number
          status?: string
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          provider?: string
          query?: string
          response_time_ms?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_api_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          appointment_id: string | null
          automation_rule_id: string | null
          campaign_id: string | null
          channel: string
          clinic_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          delivered_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          message_type: string
          metadata: Json | null
          patient_id: string
          phone: string | null
          provider_response: Json | null
          read_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          status_updated_at: string | null
          template_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          automation_rule_id?: string | null
          campaign_id?: string | null
          channel: string
          clinic_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type: string
          metadata?: Json | null
          patient_id: string
          phone?: string | null
          provider_response?: Json | null
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          status_updated_at?: string | null
          template_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          automation_rule_id?: string | null
          campaign_id?: string | null
          channel?: string
          clinic_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          patient_id?: string
          phone?: string | null
          provider_response?: Json | null
          read_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          status_updated_at?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "message_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          channel: string
          clinic_id: string
          created_at: string
          error_message: string | null
          id: string
          max_attempts: number
          message_body: string
          next_retry_at: string | null
          patient_id: string | null
          phone: string
          provider_response: Json | null
          rendered_message: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number
          automation_rule_id?: string | null
          channel?: string
          clinic_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          message_body: string
          next_retry_at?: string | null
          patient_id?: string | null
          phone: string
          provider_response?: Json | null
          rendered_message?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          attempts?: number
          automation_rule_id?: string | null
          channel?: string
          clinic_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          max_attempts?: number
          message_body?: string
          next_retry_at?: string | null
          patient_id?: string | null
          phone?: string
          provider_response?: Json | null
          rendered_message?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
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
          category: string
          channel: string
          clinic_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          category: string
          channel?: string
          clinic_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          channel?: string
          clinic_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_documento: {
        Row: {
          cabecalho_personalizado: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          nome: string
          rodape: string | null
          specialty_id: string | null
          texto_padrao: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cabecalho_personalizado?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          nome: string
          rodape?: string | null
          specialty_id?: string | null
          texto_padrao?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          cabecalho_personalizado?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          nome?: string
          rodape?: string | null
          specialty_id?: string | null
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
          {
            foreignKeyName: "modelos_documento_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_prontuario: {
        Row: {
          ativo: boolean
          clinic_id: string
          created_at: string
          created_by: string | null
          especialidade_id: string | null
          estrutura_json: Json
          id: string
          is_padrao: boolean
          is_sistema: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          clinic_id: string
          created_at?: string
          created_by?: string | null
          especialidade_id?: string | null
          estrutura_json?: Json
          id?: string
          is_padrao?: boolean
          is_sistema?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          especialidade_id?: string | null
          estrutura_json?: Json
          id?: string
          is_padrao?: boolean
          is_sistema?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_prontuario_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelos_prontuario_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_receita_profissional: {
        Row: {
          conteudo_json: Json
          created_at: string
          id: string
          nome_modelo: string
          professional_id: string
        }
        Insert: {
          conteudo_json?: Json
          created_at?: string
          id?: string
          nome_modelo: string
          professional_id: string
        }
        Update: {
          conteudo_json?: Json
          created_at?: string
          id?: string
          nome_modelo?: string
          professional_id?: string
        }
        Relationships: [
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
          appointment_id: string | null
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          odontogram_tooth_id: string
          procedure_id: string | null
          professional_id: string
          status_applied: Database["public"]["Enums"]["tooth_status"]
          surface: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          odontogram_tooth_id: string
          procedure_id?: string | null
          professional_id: string
          status_applied: Database["public"]["Enums"]["tooth_status"]
          surface?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          odontogram_tooth_id?: string
          procedure_id?: string | null
          professional_id?: string
          status_applied?: Database["public"]["Enums"]["tooth_status"]
          surface?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odontogram_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_records_odontogram_tooth_id_fkey"
            columns: ["odontogram_tooth_id"]
            isOneToOne: false
            referencedRelation: "odontogram_teeth"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_records_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogram_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogram_teeth: {
        Row: {
          id: string
          notes: string | null
          odontogram_id: string
          status: Database["public"]["Enums"]["tooth_status"]
          tooth_code: string
          updated_at: string
        }
        Insert: {
          id?: string
          notes?: string | null
          odontogram_id: string
          status?: Database["public"]["Enums"]["tooth_status"]
          tooth_code: string
          updated_at?: string
        }
        Update: {
          id?: string
          notes?: string | null
          odontogram_id?: string
          status?: Database["public"]["Enums"]["tooth_status"]
          tooth_code?: string
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
          created_by: string | null
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
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
          abordagem_terapeutica: string | null
          adolescencia: string | null
          ansiedade: string | null
          autoestima: string | null
          clinic_id: string
          comportamentos_risco: string | null
          concentracao: string | null
          contexto_alimentacao: string | null
          contexto_atividade_fisica: string | null
          contexto_familiar: string | null
          contexto_rede_apoio: string | null
          contexto_relacionamentos: string | null
          contexto_rotina: string | null
          contexto_social: string | null
          contexto_sono: string | null
          contexto_trabalho: string | null
          contexto_vida_social: string | null
          created_at: string
          created_by: string | null
          diagnostico_previo: string | null
          encaminhamentos: string | null
          estrategias_tentadas: string | null
          eventos_marcantes: string | null
          expectativas_terapia: string | null
          experiencias_traumaticas: string | null
          fatores_protecao: string | null
          fatores_risco: string | null
          formulacao_inicial: string | null
          frequencia_sessoes: string | null
          frequencia_sintomas: string | null
          hipoteses: string | null
          historico_emocional_comportamental: string | null
          historico_tratamentos: string | null
          humor_predominante: string | null
          id: string
          ideacao_suicida: boolean | null
          ideacao_suicida_obs: string | null
          impacto_vida: string | null
          impressoes_clinicas: string | null
          infancia: string | null
          intensidade_subjetiva: string | null
          internacoes: boolean | null
          internacoes_obs: string | null
          intervencoes_previstas: string | null
          irritabilidade: string | null
          is_current: boolean
          ja_fez_terapia: boolean | null
          ja_fez_terapia_obs: string | null
          modalidade: string | null
          objetivo_1: string | null
          objetivo_2: string | null
          objetivo_3: string | null
          observacao_afeto: string | null
          observacao_coerencia_discurso: string | null
          observacao_insight: string | null
          observacao_linguagem: string | null
          observacao_postura: string | null
          observacoes: string | null
          observacoes_objetivos: string | null
          ocultar_avaliacao_relatorio: boolean | null
          patient_id: string
          pensamentos_recorrentes: string | null
          quando_comecou: string | null
          queixa_principal: string | null
          quem_sugeriu_terapia: string | null
          relacionamento_pais_cuidadores: string | null
          situacoes_associadas: string | null
          uso_medicacao: boolean | null
          uso_medicacao_qual: string | null
          version: number
        }
        Insert: {
          abordagem_terapeutica?: string | null
          adolescencia?: string | null
          ansiedade?: string | null
          autoestima?: string | null
          clinic_id: string
          comportamentos_risco?: string | null
          concentracao?: string | null
          contexto_alimentacao?: string | null
          contexto_atividade_fisica?: string | null
          contexto_familiar?: string | null
          contexto_rede_apoio?: string | null
          contexto_relacionamentos?: string | null
          contexto_rotina?: string | null
          contexto_social?: string | null
          contexto_sono?: string | null
          contexto_trabalho?: string | null
          contexto_vida_social?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_previo?: string | null
          encaminhamentos?: string | null
          estrategias_tentadas?: string | null
          eventos_marcantes?: string | null
          expectativas_terapia?: string | null
          experiencias_traumaticas?: string | null
          fatores_protecao?: string | null
          fatores_risco?: string | null
          formulacao_inicial?: string | null
          frequencia_sessoes?: string | null
          frequencia_sintomas?: string | null
          hipoteses?: string | null
          historico_emocional_comportamental?: string | null
          historico_tratamentos?: string | null
          humor_predominante?: string | null
          id?: string
          ideacao_suicida?: boolean | null
          ideacao_suicida_obs?: string | null
          impacto_vida?: string | null
          impressoes_clinicas?: string | null
          infancia?: string | null
          intensidade_subjetiva?: string | null
          internacoes?: boolean | null
          internacoes_obs?: string | null
          intervencoes_previstas?: string | null
          irritabilidade?: string | null
          is_current?: boolean
          ja_fez_terapia?: boolean | null
          ja_fez_terapia_obs?: string | null
          modalidade?: string | null
          objetivo_1?: string | null
          objetivo_2?: string | null
          objetivo_3?: string | null
          observacao_afeto?: string | null
          observacao_coerencia_discurso?: string | null
          observacao_insight?: string | null
          observacao_linguagem?: string | null
          observacao_postura?: string | null
          observacoes?: string | null
          observacoes_objetivos?: string | null
          ocultar_avaliacao_relatorio?: boolean | null
          patient_id: string
          pensamentos_recorrentes?: string | null
          quando_comecou?: string | null
          queixa_principal?: string | null
          quem_sugeriu_terapia?: string | null
          relacionamento_pais_cuidadores?: string | null
          situacoes_associadas?: string | null
          uso_medicacao?: boolean | null
          uso_medicacao_qual?: string | null
          version?: number
        }
        Update: {
          abordagem_terapeutica?: string | null
          adolescencia?: string | null
          ansiedade?: string | null
          autoestima?: string | null
          clinic_id?: string
          comportamentos_risco?: string | null
          concentracao?: string | null
          contexto_alimentacao?: string | null
          contexto_atividade_fisica?: string | null
          contexto_familiar?: string | null
          contexto_rede_apoio?: string | null
          contexto_relacionamentos?: string | null
          contexto_rotina?: string | null
          contexto_social?: string | null
          contexto_sono?: string | null
          contexto_trabalho?: string | null
          contexto_vida_social?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_previo?: string | null
          encaminhamentos?: string | null
          estrategias_tentadas?: string | null
          eventos_marcantes?: string | null
          expectativas_terapia?: string | null
          experiencias_traumaticas?: string | null
          fatores_protecao?: string | null
          fatores_risco?: string | null
          formulacao_inicial?: string | null
          frequencia_sessoes?: string | null
          frequencia_sintomas?: string | null
          hipoteses?: string | null
          historico_emocional_comportamental?: string | null
          historico_tratamentos?: string | null
          humor_predominante?: string | null
          id?: string
          ideacao_suicida?: boolean | null
          ideacao_suicida_obs?: string | null
          impacto_vida?: string | null
          impressoes_clinicas?: string | null
          infancia?: string | null
          intensidade_subjetiva?: string | null
          internacoes?: boolean | null
          internacoes_obs?: string | null
          intervencoes_previstas?: string | null
          irritabilidade?: string | null
          is_current?: boolean
          ja_fez_terapia?: boolean | null
          ja_fez_terapia_obs?: string | null
          modalidade?: string | null
          objetivo_1?: string | null
          objetivo_2?: string | null
          objetivo_3?: string | null
          observacao_afeto?: string | null
          observacao_coerencia_discurso?: string | null
          observacao_insight?: string | null
          observacao_linguagem?: string | null
          observacao_postura?: string | null
          observacoes?: string | null
          observacoes_objetivos?: string | null
          ocultar_avaliacao_relatorio?: boolean | null
          patient_id?: string
          pensamentos_recorrentes?: string | null
          quando_comecou?: string | null
          queixa_principal?: string | null
          quem_sugeriu_terapia?: string | null
          relacionamento_pais_cuidadores?: string | null
          situacoes_associadas?: string | null
          uso_medicacao?: boolean | null
          uso_medicacao_qual?: string | null
          version?: number
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
        ]
      }
      patient_anamneses: {
        Row: {
          alergias: string | null
          antecedentes_familiares: string | null
          antecedentes_pessoais: string | null
          clinic_id: string
          comorbidades: string | null
          created_at: string
          created_by: string | null
          habitos_vida: string | null
          historia_doenca_atual: string | null
          historia_ginecologica: string | null
          id: string
          is_current: boolean
          medicamentos_uso_continuo: string | null
          patient_id: string
          queixa_principal: string | null
          revisao_sistemas: string | null
          structured_data: Json | null
          template_id: string | null
          version: number
        }
        Insert: {
          alergias?: string | null
          antecedentes_familiares?: string | null
          antecedentes_pessoais?: string | null
          clinic_id: string
          comorbidades?: string | null
          created_at?: string
          created_by?: string | null
          habitos_vida?: string | null
          historia_doenca_atual?: string | null
          historia_ginecologica?: string | null
          id?: string
          is_current?: boolean
          medicamentos_uso_continuo?: string | null
          patient_id: string
          queixa_principal?: string | null
          revisao_sistemas?: string | null
          structured_data?: Json | null
          template_id?: string | null
          version?: number
        }
        Update: {
          alergias?: string | null
          antecedentes_familiares?: string | null
          antecedentes_pessoais?: string | null
          clinic_id?: string
          comorbidades?: string | null
          created_at?: string
          created_by?: string | null
          habitos_vida?: string | null
          historia_doenca_atual?: string | null
          historia_ginecologica?: string | null
          id?: string
          is_current?: boolean
          medicamentos_uso_continuo?: string | null
          patient_id?: string
          queixa_principal?: string | null
          revisao_sistemas?: string | null
          structured_data?: Json | null
          template_id?: string | null
          version?: number
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
        ]
      }
      patient_clinical_data: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          chronic_diseases: string[] | null
          clinic_id: string
          clinical_restrictions: string | null
          created_at: string
          current_medications: string[] | null
          family_history: string | null
          id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          chronic_diseases?: string[] | null
          clinic_id: string
          clinical_restrictions?: string | null
          created_at?: string
          current_medications?: string[] | null
          family_history?: string | null
          id?: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          chronic_diseases?: string[] | null
          clinic_id?: string
          clinical_restrictions?: string | null
          created_at?: string
          current_medications?: string[] | null
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
      patient_condutas: {
        Row: {
          clinic_id: string
          created_at: string
          data_hora: string
          encaminhamentos: string | null
          evolucao_id: string | null
          id: string
          orientacoes: string | null
          patient_id: string
          prescricoes: string | null
          profissional_id: string
          retorno_agendado: string | null
          retorno_observacoes: string | null
          solicitacao_exames: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          data_hora?: string
          encaminhamentos?: string | null
          evolucao_id?: string | null
          id?: string
          orientacoes?: string | null
          patient_id: string
          prescricoes?: string | null
          profissional_id: string
          retorno_agendado?: string | null
          retorno_observacoes?: string | null
          solicitacao_exames?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          data_hora?: string
          encaminhamentos?: string | null
          evolucao_id?: string | null
          id?: string
          orientacoes?: string | null
          patient_id?: string
          prescricoes?: string | null
          profissional_id?: string
          retorno_agendado?: string | null
          retorno_observacoes?: string | null
          solicitacao_exames?: string | null
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
            foreignKeyName: "patient_condutas_evolucao_id_fkey"
            columns: ["evolucao_id"]
            isOneToOne: false
            referencedRelation: "patient_evolucoes"
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
            foreignKeyName: "patient_condutas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consent_status: {
        Row: {
          clinic_id: string
          consent_document_url: string | null
          consent_type: string
          created_at: string
          expires_at: string | null
          granted_at: string | null
          id: string
          ip_address: string | null
          patient_id: string
          revoked_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          consent_document_url?: string | null
          consent_type?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          consent_document_url?: string | null
          consent_type?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          revoked_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_consent_status_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consent_status_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          clinic_id: string
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          ip_address: string | null
          patient_id: string
          revoked_at: string | null
          status: string
          term_id: string
          term_version: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          revoked_at?: string | null
          status?: string
          term_id: string
          term_version: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          revoked_at?: string | null
          status?: string
          term_id?: string
          term_version?: string
          updated_at?: string
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
          appointment_id: string | null
          clinic_id: string
          codigo_cid10: string | null
          created_at: string
          data_diagnostico: string
          data_resolucao: string | null
          descricao_cid10: string | null
          descricao_personalizada: string | null
          id: string
          observacoes: string | null
          patient_id: string
          profissional_id: string
          status: string
          tipo_diagnostico: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          codigo_cid10?: string | null
          created_at?: string
          data_diagnostico?: string
          data_resolucao?: string | null
          descricao_cid10?: string | null
          descricao_personalizada?: string | null
          id?: string
          observacoes?: string | null
          patient_id: string
          profissional_id: string
          status?: string
          tipo_diagnostico?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          codigo_cid10?: string | null
          created_at?: string
          data_diagnostico?: string
          data_resolucao?: string | null
          descricao_cid10?: string | null
          descricao_personalizada?: string | null
          id?: string
          observacoes?: string | null
          patient_id?: string
          profissional_id?: string
          status?: string
          tipo_diagnostico?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_diagnosticos_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "patient_diagnosticos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documentos: {
        Row: {
          categoria: string
          clinic_id: string
          created_at: string
          data_documento: string | null
          descricao: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          observacoes: string | null
          patient_id: string
          profissional_id: string
          titulo: string
        }
        Insert: {
          categoria?: string
          clinic_id: string
          created_at?: string
          data_documento?: string | null
          descricao?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          observacoes?: string | null
          patient_id: string
          profissional_id: string
          titulo: string
        }
        Update: {
          categoria?: string
          clinic_id?: string
          created_at?: string
          data_documento?: string | null
          descricao?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          observacoes?: string | null
          patient_id?: string
          profissional_id?: string
          titulo?: string
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
            foreignKeyName: "patient_documentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_evolucoes: {
        Row: {
          assinada_em: string | null
          clinic_id: string
          conduta: string | null
          created_at: string
          data_hora: string
          descricao_clinica: string
          hipoteses_diagnosticas: string | null
          id: string
          patient_id: string
          profissional_id: string
          status: string
          tipo_atendimento: string
        }
        Insert: {
          assinada_em?: string | null
          clinic_id: string
          conduta?: string | null
          created_at?: string
          data_hora?: string
          descricao_clinica: string
          hipoteses_diagnosticas?: string | null
          id?: string
          patient_id: string
          profissional_id: string
          status?: string
          tipo_atendimento?: string
        }
        Update: {
          assinada_em?: string | null
          clinic_id?: string
          conduta?: string | null
          created_at?: string
          data_hora?: string
          descricao_clinica?: string
          hipoteses_diagnosticas?: string | null
          id?: string
          patient_id?: string
          profissional_id?: string
          status?: string
          tipo_atendimento?: string
        }
        Relationships: [
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
            foreignKeyName: "patient_evolucoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_exames_fisicos: {
        Row: {
          altura: number | null
          clinic_id: string
          created_at: string
          data_hora: string
          evolucao_id: string | null
          frequencia_cardiaca: number | null
          frequencia_respiratoria: number | null
          id: string
          imc: number | null
          observacoes: string | null
          patient_id: string
          peso: number | null
          pressao_diastolica: number | null
          pressao_sistolica: number | null
          profissional_id: string
          temperatura: number | null
        }
        Insert: {
          altura?: number | null
          clinic_id: string
          created_at?: string
          data_hora?: string
          evolucao_id?: string | null
          frequencia_cardiaca?: number | null
          frequencia_respiratoria?: number | null
          id?: string
          imc?: number | null
          observacoes?: string | null
          patient_id: string
          peso?: number | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          profissional_id: string
          temperatura?: number | null
        }
        Update: {
          altura?: number | null
          clinic_id?: string
          created_at?: string
          data_hora?: string
          evolucao_id?: string | null
          frequencia_cardiaca?: number | null
          frequencia_respiratoria?: number | null
          id?: string
          imc?: number | null
          observacoes?: string | null
          patient_id?: string
          peso?: number | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          profissional_id?: string
          temperatura?: number | null
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
            foreignKeyName: "patient_exames_fisicos_evolucao_id_fkey"
            columns: ["evolucao_id"]
            isOneToOne: false
            referencedRelation: "patient_evolucoes"
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
            foreignKeyName: "patient_exames_fisicos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_generated_documents: {
        Row: {
          clinic_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          generated_by: string
          id: string
          patient_id: string
          source_record_id: string | null
          title: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          generated_by: string
          id?: string
          patient_id: string
          source_record_id?: string | null
          title: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          generated_by?: string
          id?: string
          patient_id?: string
          source_record_id?: string | null
          title?: string
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
        ]
      }
      patient_guardians: {
        Row: {
          clinic_id: string
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean | null
          patient_id: string
          phone: string | null
          relationship: string
          rg: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean | null
          patient_id: string
          phone?: string | null
          relationship: string
          rg?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean | null
          patient_id?: string
          phone?: string | null
          relationship?: string
          rg?: string | null
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
          card_number: string
          clinic_id: string
          created_at: string
          holder_cpf: string | null
          holder_name: string | null
          holder_type: string
          id: string
          insurance_id: string
          is_active: boolean
          is_primary: boolean
          notes: string | null
          patient_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          card_number: string
          clinic_id: string
          created_at?: string
          holder_cpf?: string | null
          holder_name?: string | null
          holder_type?: string
          id?: string
          insurance_id: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          patient_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          card_number?: string
          clinic_id?: string
          created_at?: string
          holder_cpf?: string | null
          holder_name?: string | null
          holder_type?: string
          id?: string
          insurance_id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          patient_id?: string
          updated_at?: string
          valid_until?: string | null
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
      patient_prescricao_itens: {
        Row: {
          created_at: string
          dose: string
          duracao_dias: number | null
          frequencia: string | null
          id: string
          instrucoes_especiais: string | null
          medicamento_concentracao: string | null
          medicamento_forma_farmaceutica: string | null
          medicamento_nome: string
          medicamento_principio_ativo: string | null
          ordem: number | null
          posologia: string
          prescricao_id: string
          unidade_dose: string | null
          uso_continuo: boolean | null
          via_administracao: string | null
        }
        Insert: {
          created_at?: string
          dose: string
          duracao_dias?: number | null
          frequencia?: string | null
          id?: string
          instrucoes_especiais?: string | null
          medicamento_concentracao?: string | null
          medicamento_forma_farmaceutica?: string | null
          medicamento_nome: string
          medicamento_principio_ativo?: string | null
          ordem?: number | null
          posologia: string
          prescricao_id: string
          unidade_dose?: string | null
          uso_continuo?: boolean | null
          via_administracao?: string | null
        }
        Update: {
          created_at?: string
          dose?: string
          duracao_dias?: number | null
          frequencia?: string | null
          id?: string
          instrucoes_especiais?: string | null
          medicamento_concentracao?: string | null
          medicamento_forma_farmaceutica?: string | null
          medicamento_nome?: string
          medicamento_principio_ativo?: string | null
          ordem?: number | null
          posologia?: string
          prescricao_id?: string
          unidade_dose?: string | null
          uso_continuo?: boolean | null
          via_administracao?: string | null
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
          appointment_id: string | null
          assinada_em: string | null
          clinic_id: string
          codigo_verificacao: string | null
          created_at: string
          data_prescricao: string
          id: string
          numero_receita: string | null
          observacoes: string | null
          patient_id: string
          profissional_id: string
          status: string
          tipo_receita: string
          updated_at: string
          validade_dias: number | null
        }
        Insert: {
          appointment_id?: string | null
          assinada_em?: string | null
          clinic_id: string
          codigo_verificacao?: string | null
          created_at?: string
          data_prescricao?: string
          id?: string
          numero_receita?: string | null
          observacoes?: string | null
          patient_id: string
          profissional_id: string
          status?: string
          tipo_receita?: string
          updated_at?: string
          validade_dias?: number | null
        }
        Update: {
          appointment_id?: string | null
          assinada_em?: string | null
          clinic_id?: string
          codigo_verificacao?: string | null
          created_at?: string
          data_prescricao?: string
          id?: string
          numero_receita?: string | null
          observacoes?: string | null
          patient_id?: string
          profissional_id?: string
          status?: string
          tipo_receita?: string
          updated_at?: string
          validade_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_prescricoes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "patient_prescricoes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_scale_readings: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          evolution_id: string | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          recorded_by: string
          scale_id: string
          value: number
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          evolution_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          recorded_by: string
          scale_id: string
          value: number
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          evolution_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          recorded_by?: string
          scale_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_scale_readings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_scale_readings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_scale_readings_evolution_id_fkey"
            columns: ["evolution_id"]
            isOneToOne: false
            referencedRelation: "clinical_evolutions"
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
            foreignKeyName: "patient_scale_readings_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "clinical_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tag_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          clinic_id: string
          id: string
          patient_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          clinic_id: string
          id?: string
          patient_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          clinic_id?: string
          id?: string
          patient_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tag_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tag_assignments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tag_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "patient_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tags: {
        Row: {
          clinic_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tags_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
          clinic_id: string
          created_at: string
          created_by: string | null
          criterios_reavaliacao: string | null
          estrategias_intervencao: string | null
          frequencia_recomendada: string | null
          id: string
          is_current: boolean
          metas_curto_prazo: string | null
          metas_longo_prazo: string | null
          metas_medio_prazo: string | null
          objetivos_terapeuticos: string | null
          observacoes: string | null
          patient_id: string
          version: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          criterios_reavaliacao?: string | null
          estrategias_intervencao?: string | null
          frequencia_recomendada?: string | null
          id?: string
          is_current?: boolean
          metas_curto_prazo?: string | null
          metas_longo_prazo?: string | null
          metas_medio_prazo?: string | null
          objetivos_terapeuticos?: string | null
          observacoes?: string | null
          patient_id: string
          version?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          criterios_reavaliacao?: string | null
          estrategias_intervencao?: string | null
          frequencia_recomendada?: string | null
          id?: string
          is_current?: boolean
          metas_curto_prazo?: string | null
          metas_longo_prazo?: string | null
          metas_medio_prazo?: string | null
          objetivos_terapeuticos?: string | null
          observacoes?: string | null
          patient_id?: string
          version?: number
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
        ]
      }
      planos_acao_crise: {
        Row: {
          clinic_id: string
          contato_intermediario: boolean
          contato_responsavel: boolean
          created_at: string
          descricao_intervencao: string
          encaminhamento_caps: boolean
          encaminhamento_emergencial: boolean
          encaminhamento_hospital: boolean
          encaminhamento_medico: boolean
          encaminhamento_outro: string | null
          id: string
          observacoes_adicionais: string | null
          patient_id: string
          profissional_id: string
          regression_status: string
          risco_iminente: boolean
          sessao_antecipada: boolean
          sessao_id: string
          tecnica_aplicada: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          contato_intermediario?: boolean
          contato_responsavel?: boolean
          created_at?: string
          descricao_intervencao: string
          encaminhamento_caps?: boolean
          encaminhamento_emergencial?: boolean
          encaminhamento_hospital?: boolean
          encaminhamento_medico?: boolean
          encaminhamento_outro?: string | null
          id?: string
          observacoes_adicionais?: string | null
          patient_id: string
          profissional_id: string
          regression_status?: string
          risco_iminente?: boolean
          sessao_antecipada?: boolean
          sessao_id: string
          tecnica_aplicada?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          contato_intermediario?: boolean
          contato_responsavel?: boolean
          created_at?: string
          descricao_intervencao?: string
          encaminhamento_caps?: boolean
          encaminhamento_emergencial?: boolean
          encaminhamento_hospital?: boolean
          encaminhamento_medico?: boolean
          encaminhamento_outro?: string | null
          id?: string
          observacoes_adicionais?: string | null
          patient_id?: string
          profissional_id?: string
          regression_status?: string
          risco_iminente?: boolean
          sessao_antecipada?: boolean
          sessao_id?: string
          tecnica_aplicada?: string | null
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
            foreignKeyName: "planos_acao_crise_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_acao_crise_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes_psicologia"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_kits: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_required: boolean
          kit_id: string
          procedure_id: string
          quantity: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          kit_id: string
          procedure_id: string
          quantity?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          kit_id?: string
          procedure_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedure_kits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_kits_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "material_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_kits_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_materials: {
        Row: {
          allow_manual_edit: boolean
          clinic_id: string
          created_at: string
          id: string
          is_required: boolean
          material_id: string
          notes: string | null
          procedure_id: string
          quantity: number
          unit: string
        }
        Insert: {
          allow_manual_edit?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          material_id: string
          notes?: string | null
          procedure_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          allow_manual_edit?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          material_id?: string
          notes?: string | null
          procedure_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_materials_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_materials_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_product_kits: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_required: boolean
          kit_id: string
          procedure_id: string
          quantity: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          kit_id: string
          procedure_id: string
          quantity?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          kit_id?: string
          procedure_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedure_product_kits_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_product_kits_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedure_product_kits_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_products: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          notes: string | null
          procedure_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          notes?: string | null
          procedure_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          procedure_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
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
          specialty_id: string | null
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
          specialty_id?: string | null
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
          specialty_id?: string | null
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
          {
            foreignKeyName: "procedures_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
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
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
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
          barcode: string | null
          category: string | null
          clinic_id: string
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_stock_quantity: number | null
          name: string
          sale_price: number
          sku: string | null
          stock_quantity: number
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          clinic_id: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock_quantity?: number | null
          name: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category?: string | null
          clinic_id?: string
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock_quantity?: number | null
          name?: string
          sale_price?: number
          sku?: string | null
          stock_quantity?: number
          supplier?: string | null
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
      professional_anamnesis_models: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_default: boolean
          professional_id: string
          template_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          professional_id: string
          template_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          professional_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_anamnesis_models_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_anamnesis_models_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_authorized_flows: {
        Row: {
          clinic_id: string
          created_at: string | null
          flow_id: string
          id: string
          professional_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          flow_id: string
          id?: string
          professional_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          flow_id?: string
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_authorized_flows_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_authorized_flows_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_authorized_procedures: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          procedure_id: string
          professional_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          procedure_id: string
          professional_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          procedure_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_authorized_procedures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
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
          clinic_id: string
          created_at: string | null
          id: string
          professional_id: string
          room_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          professional_id: string
          room_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          professional_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_authorized_rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
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
      professional_authorized_templates: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          professional_id: string
          template_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          professional_id: string
          template_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          professional_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_authorized_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_authorized_templates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedule_config: {
        Row: {
          clinic_id: string
          created_at: string
          default_duration_minutes: number | null
          id: string
          professional_id: string
          updated_at: string
          use_clinic_default: boolean
          working_days: Json | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          default_duration_minutes?: number | null
          id?: string
          professional_id: string
          updated_at?: string
          use_clinic_default?: boolean
          working_days?: Json | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          default_duration_minutes?: number | null
          id?: string
          professional_id?: string
          updated_at?: string
          use_clinic_default?: boolean
          working_days?: Json | null
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
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_schedules: {
        Row: {
          clinic_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          professional_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          professional_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          professional_id?: string
          start_time?: string
          updated_at?: string | null
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
          signature_url: string | null
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
          signature_url?: string | null
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
          signature_url?: string | null
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
      prontuario_access_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          patient_id: string
          section: string | null
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
          patient_id: string
          section?: string | null
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
          patient_id?: string
          section?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prontuario_access_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuario_access_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuario_print_config: {
        Row: {
          clinic_id: string
          created_at: string
          exportable_sections: Json
          footer_text: string | null
          header_text: string | null
          id: string
          include_clinic_info: boolean
          include_logo: boolean
          include_page_numbers: boolean
          margin_mm: number
          orientation: string
          paper_size: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          exportable_sections?: Json
          footer_text?: string | null
          header_text?: string | null
          id?: string
          include_clinic_info?: boolean
          include_logo?: boolean
          include_page_numbers?: boolean
          margin_mm?: number
          orientation?: string
          paper_size?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          exportable_sections?: Json
          footer_text?: string | null
          header_text?: string | null
          id?: string
          include_clinic_info?: boolean
          include_logo?: boolean
          include_page_numbers?: boolean
          margin_mm?: number
          orientation?: string
          paper_size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prontuario_print_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuario_security_config: {
        Row: {
          allow_amendment: boolean
          block_after_signature: boolean
          clinic_id: string
          consent_validity_days: number
          created_at: string
          id: string
          log_all_access: boolean
          log_data_changes: boolean
          log_print_export: boolean
          require_2fa_for_access: boolean
          require_consent_before_access: boolean
          retention_years: number
          session_timeout_minutes: number
          show_consent_status: boolean
          signature_lock_hours: number
          updated_at: string
        }
        Insert: {
          allow_amendment?: boolean
          block_after_signature?: boolean
          clinic_id: string
          consent_validity_days?: number
          created_at?: string
          id?: string
          log_all_access?: boolean
          log_data_changes?: boolean
          log_print_export?: boolean
          require_2fa_for_access?: boolean
          require_consent_before_access?: boolean
          retention_years?: number
          session_timeout_minutes?: number
          show_consent_status?: boolean
          signature_lock_hours?: number
          updated_at?: string
        }
        Update: {
          allow_amendment?: boolean
          block_after_signature?: boolean
          clinic_id?: string
          consent_validity_days?: number
          created_at?: string
          id?: string
          log_all_access?: boolean
          log_data_changes?: boolean
          log_print_export?: boolean
          require_2fa_for_access?: boolean
          require_consent_before_access?: boolean
          retention_years?: number
          session_timeout_minutes?: number
          show_consent_status?: boolean
          signature_lock_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prontuario_security_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuario_tabs_config: {
        Row: {
          clinic_id: string
          created_at: string
          default_anamnesis_template_id: string | null
          id: string
          professional_id: string | null
          specialty: string | null
          tabs_config: Json
          updated_at: string
          use_system_default: boolean
        }
        Insert: {
          clinic_id: string
          created_at?: string
          default_anamnesis_template_id?: string | null
          id?: string
          professional_id?: string | null
          specialty?: string | null
          tabs_config?: Json
          updated_at?: string
          use_system_default?: boolean
        }
        Update: {
          clinic_id?: string
          created_at?: string
          default_anamnesis_template_id?: string | null
          id?: string
          professional_id?: string | null
          specialty?: string | null
          tabs_config?: Json
          updated_at?: string
          use_system_default?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "prontuario_tabs_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuario_tabs_config_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      prontuario_visual_config: {
        Row: {
          accent_color: string
          clinic_id: string
          created_at: string
          font_size: string
          id: string
          layout_mode: string
          logo_position: string
          logo_url: string | null
          primary_color: string
          professional_id: string | null
          secondary_color: string
          show_alerts_header: boolean
          show_patient_photo: boolean
          updated_at: string
        }
        Insert: {
          accent_color?: string
          clinic_id: string
          created_at?: string
          font_size?: string
          id?: string
          layout_mode?: string
          logo_position?: string
          logo_url?: string | null
          primary_color?: string
          professional_id?: string | null
          secondary_color?: string
          show_alerts_header?: boolean
          show_patient_photo?: boolean
          updated_at?: string
        }
        Update: {
          accent_color?: string
          clinic_id?: string
          created_at?: string
          font_size?: string
          id?: string
          layout_mode?: string
          logo_position?: string
          logo_url?: string | null
          primary_color?: string
          professional_id?: string | null
          secondary_color?: string
          show_alerts_header?: boolean
          show_patient_photo?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prontuario_visual_config_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prontuario_visual_config_professional_id_fkey"
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
          completed_by: string | null
          id: string
          notes: string | null
          plan_id: string
          session_number: number
          status: string
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          session_number: number
          status?: string
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
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
          actual_end_date: string | null
          clinic_id: string
          completed_sessions: number
          created_at: string
          created_by: string
          description: string | null
          expected_end_date: string | null
          frequency: string | null
          id: string
          notes: string | null
          patient_id: string
          procedure_id: string | null
          professional_id: string
          start_date: string
          status: string
          title: string
          total_sessions: number
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          clinic_id: string
          completed_sessions?: number
          created_at?: string
          created_by: string
          description?: string | null
          expected_end_date?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          professional_id: string
          start_date: string
          status?: string
          title: string
          total_sessions: number
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          clinic_id?: string
          completed_sessions?: number
          created_at?: string
          created_by?: string
          description?: string | null
          expected_end_date?: string | null
          frequency?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          professional_id?: string
          start_date?: string
          status?: string
          title?: string
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
          clinic_id: string
          cost_price: number | null
          created_at: string
          discount_amount: number | null
          id: string
          margin_percent: number | null
          notes: string | null
          product_id: string
          product_name: string
          profit: number | null
          quantity: number
          sale_id: string
          total_cost: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          clinic_id: string
          cost_price?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          margin_percent?: number | null
          notes?: string | null
          product_id: string
          product_name: string
          profit?: number | null
          quantity: number
          sale_id: string
          total_cost?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          clinic_id?: string
          cost_price?: number | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          margin_percent?: number | null
          notes?: string | null
          product_id?: string
          product_name?: string
          profit?: number | null
          quantity?: number
          sale_id?: string
          total_cost?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
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
          appointment_id: string | null
          canceled_at: string | null
          canceled_by: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          notes: string | null
          patient_id: string | null
          payment_method: string | null
          payment_status: string
          professional_id: string | null
          sale_date: string
          sale_number: string | null
          status: string
          subtotal: number
          total_amount: number
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_status?: string
          professional_id?: string | null
          sale_date?: string
          sale_number?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          canceled_at?: string | null
          canceled_by?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          payment_method?: string | null
          payment_status?: string
          professional_id?: string | null
          sale_date?: string
          sale_number?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_transaction"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
          data_sessao: string
          duracao_minutos: number
          emocoes_predominantes: string[] | null
          encaminhamentos_tags: string[] | null
          encaminhamentos_tarefas: string | null
          evolucao_caso: string | null
          gad7_respostas: number[] | null
          gad7_total: number | null
          humor_paciente: number | null
          id: string
          intervencoes_realizadas: string | null
          intervencoes_tags: string[] | null
          modalidade: string | null
          numero_sessao: number | null
          observacoes_terapeuta: string | null
          patient_id: string
          phq9_respostas: number[] | null
          phq9_total: number | null
          profissional_id: string
          proximo_foco: string | null
          relato_paciente: string | null
          risco_atual: string | null
          risco_interno: string | null
          status: string
          tarefa_casa: string | null
          tema_central: string | null
          updated_at: string
        }
        Insert: {
          abordagem_terapeutica?: string | null
          adesao_terapeutica?: string | null
          assinada_em?: string | null
          clinic_id: string
          created_at?: string
          data_sessao?: string
          duracao_minutos?: number
          emocoes_predominantes?: string[] | null
          encaminhamentos_tags?: string[] | null
          encaminhamentos_tarefas?: string | null
          evolucao_caso?: string | null
          gad7_respostas?: number[] | null
          gad7_total?: number | null
          humor_paciente?: number | null
          id?: string
          intervencoes_realizadas?: string | null
          intervencoes_tags?: string[] | null
          modalidade?: string | null
          numero_sessao?: number | null
          observacoes_terapeuta?: string | null
          patient_id: string
          phq9_respostas?: number[] | null
          phq9_total?: number | null
          profissional_id: string
          proximo_foco?: string | null
          relato_paciente?: string | null
          risco_atual?: string | null
          risco_interno?: string | null
          status?: string
          tarefa_casa?: string | null
          tema_central?: string | null
          updated_at?: string
        }
        Update: {
          abordagem_terapeutica?: string | null
          adesao_terapeutica?: string | null
          assinada_em?: string | null
          clinic_id?: string
          created_at?: string
          data_sessao?: string
          duracao_minutos?: number
          emocoes_predominantes?: string[] | null
          encaminhamentos_tags?: string[] | null
          encaminhamentos_tarefas?: string | null
          evolucao_caso?: string | null
          gad7_respostas?: number[] | null
          gad7_total?: number | null
          humor_paciente?: number | null
          id?: string
          intervencoes_realizadas?: string | null
          intervencoes_tags?: string[] | null
          modalidade?: string | null
          numero_sessao?: number | null
          observacoes_terapeuta?: string | null
          patient_id?: string
          phq9_respostas?: number[] | null
          phq9_total?: number | null
          profissional_id?: string
          proximo_foco?: string | null
          relato_paciente?: string | null
          risco_atual?: string | null
          risco_interno?: string | null
          status?: string
          tarefa_casa?: string | null
          tema_central?: string | null
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
            foreignKeyName: "sessoes_psicologia_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          area: string | null
          clinic_id: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          specialty_type: Database["public"]["Enums"]["specialty_type"]
          updated_at: string
        }
        Insert: {
          area?: string | null
          clinic_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          specialty_type?: Database["public"]["Enums"]["specialty_type"]
          updated_at?: string
        }
        Update: {
          area?: string | null
          clinic_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          specialty_type?: Database["public"]["Enums"]["specialty_type"]
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
      specialty_field_templates: {
        Row: {
          clinic_id: string | null
          created_at: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_order: number | null
          field_type: string
          id: string
          is_required: boolean | null
          is_system: boolean | null
          specialty: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_order?: number | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          is_system?: boolean | null
          specialty: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_order?: number | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          is_system?: boolean | null
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialty_field_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      specialty_module_defaults: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          module_id: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_id: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          module_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialty_module_defaults_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "clinical_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialty_module_defaults_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: string
          appointment_id: string | null
          clinic_id: string
          created_at: string
          current_quantity: number | null
          id: string
          is_resolved: boolean | null
          material_id: string
          min_quantity: number | null
          required_quantity: number | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          alert_type: string
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          current_quantity?: number | null
          id?: string
          is_resolved?: boolean | null
          material_id: string
          min_quantity?: number | null
          required_quantity?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          alert_type?: string
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          current_quantity?: number | null
          id?: string
          is_resolved?: boolean | null
          material_id?: string
          min_quantity?: number | null
          required_quantity?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_categories: {
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
            foreignKeyName: "stock_categories_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_quantity: number | null
          notes: string | null
          previous_quantity: number | null
          procedure_id: string | null
          product_id: string
          professional_id: string | null
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          procedure_id?: string | null
          product_id: string
          professional_id?: string | null
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          procedure_id?: string | null
          product_id?: string
          professional_id?: string | null
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
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
            foreignKeyName: "stock_movements_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_prediction_settings: {
        Row: {
          alert_level: string
          clinic_id: string
          created_at: string
          enabled: boolean
          id: string
          prediction_days: number
          updated_at: string
        }
        Insert: {
          alert_level?: string
          clinic_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          prediction_days?: number
          updated_at?: string
        }
        Update: {
          alert_level?: string
          clinic_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          prediction_days?: number
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
      stock_products: {
        Row: {
          avg_cost: number | null
          category_id: string | null
          clinic_id: string
          created_at: string
          current_quantity: number
          expiration_date: string | null
          id: string
          is_active: boolean
          min_quantity: number
          name: string
          notes: string | null
          sale_price: number | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          avg_cost?: number | null
          category_id?: string | null
          clinic_id: string
          created_at?: string
          current_quantity?: number
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name: string
          notes?: string | null
          sale_price?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          avg_cost?: number | null
          category_id?: string | null
          clinic_id?: string
          created_at?: string
          current_quantity?: number
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          name?: string
          notes?: string | null
          sale_price?: number | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "stock_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      system_security_settings: {
        Row: {
          allow_patient_data_deletion: boolean
          anonymize_reports: boolean
          clinic_id: string
          created_at: string
          enable_access_logging: boolean
          enable_digital_signature: boolean
          enable_tab_permissions: boolean
          enforce_consent_before_care: boolean
          id: string
          lock_record_without_consent: boolean
          log_retention_days: number
          require_consent_on_registration: boolean
          updated_at: string
        }
        Insert: {
          allow_patient_data_deletion?: boolean
          anonymize_reports?: boolean
          clinic_id: string
          created_at?: string
          enable_access_logging?: boolean
          enable_digital_signature?: boolean
          enable_tab_permissions?: boolean
          enforce_consent_before_care?: boolean
          id?: string
          lock_record_without_consent?: boolean
          log_retention_days?: number
          require_consent_on_registration?: boolean
          updated_at?: string
        }
        Update: {
          allow_patient_data_deletion?: boolean
          anonymize_reports?: boolean
          clinic_id?: string
          created_at?: string
          enable_access_logging?: boolean
          enable_digital_signature?: boolean
          enable_tab_permissions?: boolean
          enforce_consent_before_care?: boolean
          id?: string
          lock_record_without_consent?: boolean
          log_retention_days?: number
          require_consent_on_registration?: boolean
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
      template_fields: {
        Row: {
          created_at: string
          field_name: string
          field_order: number
          field_type: string
          id: string
          is_required: boolean
          options: Json | null
          template_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          template_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          field_order?: number
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          template_id?: string
        }
        Relationships: []
      }
      therapeutic_goal_updates: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          new_progress: number
          observation: string | null
          previous_progress: number
          score_value: number | null
          sessao_id: string | null
          updated_by: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          new_progress: number
          observation?: string | null
          previous_progress: number
          score_value?: number | null
          sessao_id?: string | null
          updated_by: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          new_progress?: number
          observation?: string | null
          previous_progress?: number
          score_value?: number | null
          sessao_id?: string | null
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
          completed_at: string | null
          created_at: string
          current_score: number | null
          description: string | null
          goal_type: string
          id: string
          initial_score: number | null
          is_measurable: boolean
          patient_id: string
          priority: string
          professional_id: string
          progress: number
          review_date: string | null
          scale_name: string | null
          status: string
          success_indicator: string | null
          target_score: number | null
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          completed_at?: string | null
          created_at?: string
          current_score?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          initial_score?: number | null
          is_measurable?: boolean
          patient_id: string
          priority?: string
          professional_id: string
          progress?: number
          review_date?: string | null
          scale_name?: string | null
          status?: string
          success_indicator?: string | null
          target_score?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          completed_at?: string | null
          created_at?: string
          current_score?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          initial_score?: number | null
          is_measurable?: boolean
          patient_id?: string
          priority?: string
          professional_id?: string
          progress?: number
          review_date?: string | null
          scale_name?: string | null
          status?: string
          success_indicator?: string | null
          target_score?: number | null
          title?: string
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
        ]
      }
      therapeutic_plans: {
        Row: {
          clinic_id: string
          created_at: string
          created_by: string
          expected_outcomes: string | null
          id: string
          interventions: Json | null
          notes: string | null
          objectives: Json | null
          patient_id: string
          professional_id: string
          review_date: string | null
          specialty_id: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          created_by: string
          expected_outcomes?: string | null
          id?: string
          interventions?: Json | null
          notes?: string | null
          objectives?: Json | null
          patient_id: string
          professional_id: string
          review_date?: string | null
          specialty_id?: string | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          created_by?: string
          expected_outcomes?: string | null
          id?: string
          interventions?: Json | null
          notes?: string | null
          objectives?: Json | null
          patient_id?: string
          professional_id?: string
          review_date?: string | null
          specialty_id?: string | null
          start_date?: string
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
      tiss_guide_history: {
        Row: {
          action: string
          changes: Json | null
          clinic_id: string
          guide_id: string
          id: string
          new_status: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          previous_status: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          clinic_id: string
          guide_id: string
          id?: string
          new_status?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          previous_status?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          clinic_id?: string
          guide_id?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiss_guide_history_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiss_guide_history_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tiss_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      tiss_guide_items: {
        Row: {
          approved_quantity: number | null
          approved_value: number | null
          clinic_id: string
          created_at: string
          end_time: string | null
          execution_date: string | null
          glosa_code: string | null
          glosa_reason: string | null
          glosa_value: number | null
          guide_id: string
          id: string
          item_order: number
          pathway: string | null
          procedure_code: string | null
          procedure_description: string
          procedure_id: string | null
          quantity: number
          start_time: string | null
          technique: string | null
          total_value: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          approved_quantity?: number | null
          approved_value?: number | null
          clinic_id: string
          created_at?: string
          end_time?: string | null
          execution_date?: string | null
          glosa_code?: string | null
          glosa_reason?: string | null
          glosa_value?: number | null
          guide_id: string
          id?: string
          item_order?: number
          pathway?: string | null
          procedure_code?: string | null
          procedure_description: string
          procedure_id?: string | null
          quantity?: number
          start_time?: string | null
          technique?: string | null
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          approved_quantity?: number | null
          approved_value?: number | null
          clinic_id?: string
          created_at?: string
          end_time?: string | null
          execution_date?: string | null
          glosa_code?: string | null
          glosa_reason?: string | null
          glosa_value?: number | null
          guide_id?: string
          id?: string
          item_order?: number
          pathway?: string | null
          procedure_code?: string | null
          procedure_description?: string
          procedure_id?: string | null
          quantity?: number
          start_time?: string | null
          technique?: string | null
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiss_guide_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
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
          approved_at: string | null
          beneficiary_card_number: string | null
          beneficiary_card_validity: string | null
          beneficiary_name: string | null
          clinic_id: string
          cnes_code: string | null
          contractor_code: string | null
          contractor_name: string | null
          created_at: string
          created_by: string | null
          guide_number: string
          guide_type: Database["public"]["Enums"]["tiss_guide_type"]
          id: string
          insurance_id: string
          issue_date: string
          main_authorization_number: string | null
          notes: string | null
          patient_id: string
          patient_insurance_id: string | null
          professional_id: string | null
          rejection_reason: string | null
          service_date: string
          status: Database["public"]["Enums"]["tiss_guide_status"]
          submitted_at: string | null
          tiss_version: string | null
          total_approved: number | null
          total_glosa: number | null
          total_requested: number | null
          updated_at: string
          updated_by: string | null
          valid_until: string | null
          xml_data: Json | null
        }
        Insert: {
          appointment_id?: string | null
          approved_at?: string | null
          beneficiary_card_number?: string | null
          beneficiary_card_validity?: string | null
          beneficiary_name?: string | null
          clinic_id: string
          cnes_code?: string | null
          contractor_code?: string | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string | null
          guide_number: string
          guide_type?: Database["public"]["Enums"]["tiss_guide_type"]
          id?: string
          insurance_id: string
          issue_date?: string
          main_authorization_number?: string | null
          notes?: string | null
          patient_id: string
          patient_insurance_id?: string | null
          professional_id?: string | null
          rejection_reason?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["tiss_guide_status"]
          submitted_at?: string | null
          tiss_version?: string | null
          total_approved?: number | null
          total_glosa?: number | null
          total_requested?: number | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          xml_data?: Json | null
        }
        Update: {
          appointment_id?: string | null
          approved_at?: string | null
          beneficiary_card_number?: string | null
          beneficiary_card_validity?: string | null
          beneficiary_name?: string | null
          clinic_id?: string
          cnes_code?: string | null
          contractor_code?: string | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string | null
          guide_number?: string
          guide_type?: Database["public"]["Enums"]["tiss_guide_type"]
          id?: string
          insurance_id?: string
          issue_date?: string
          main_authorization_number?: string | null
          notes?: string | null
          patient_id?: string
          patient_insurance_id?: string | null
          professional_id?: string | null
          rejection_reason?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["tiss_guide_status"]
          submitted_at?: string | null
          tiss_version?: string | null
          total_approved?: number | null
          total_glosa?: number | null
          total_requested?: number | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          xml_data?: Json | null
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
          status?: string
          total_amount: number
          total_sessions: number
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
        ]
      }
      user_audit_logs: {
        Row: {
          action: string
          clinic_id: string
          created_at: string
          details: Json | null
          id: string
          performed_by: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          clinic_id: string
          created_at?: string
          details?: Json | null
          id?: string
          performed_by: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string
          created_at?: string
          details?: Json | null
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
          full_name: string
          id: string
          invited_by: string
          is_professional: boolean
          permissions: Database["public"]["Enums"]["app_module"][] | null
          professional_type: string | null
          registration_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          specialty_ids: string[] | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          clinic_id: string
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invited_by: string
          is_professional?: boolean
          permissions?: Database["public"]["Enums"]["app_module"][] | null
          professional_type?: string | null
          registration_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          specialty_ids?: string[] | null
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          clinic_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invited_by?: string
          is_professional?: boolean
          permissions?: Database["public"]["Enums"]["app_module"][] | null
          professional_type?: string | null
          registration_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          specialty_ids?: string[] | null
          status?: string
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
      user_permissions: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          permission_agenda: boolean
          permission_atendimento: boolean
          permission_controles: boolean
          permission_pacientes: boolean
          permission_prontuario: boolean
          permission_relatorios: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          permission_agenda?: boolean
          permission_atendimento?: boolean
          permission_controles?: boolean
          permission_pacientes?: boolean
          permission_prontuario?: boolean
          permission_relatorios?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          permission_agenda?: boolean
          permission_atendimento?: boolean
          permission_controles?: boolean
          permission_pacientes?: boolean
          permission_prontuario?: boolean
          permission_relatorios?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_clinic_id_fkey"
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
      calculate_procedure_cost: {
        Args: { p_procedure_id: string }
        Returns: number
      }
      calculate_procedure_cost_from_products: {
        Args: { p_procedure_id: string }
        Returns: number
      }
      calculate_procedure_total_cost: {
        Args: { p_procedure_id: string }
        Returns: number
      }
      calculate_product_kit_cost: {
        Args: { p_kit_id: string }
        Returns: number
      }
      calculate_stock_predictions: {
        Args: { p_clinic_id: string; p_days_ahead?: number }
        Returns: {
          current_stock: number
          first_shortage_date: string
          impacting_procedures: Json
          min_stock: number
          predicted_consumption: number
          product_id: string
          product_name: string
          product_unit: string
          projected_stock: number
        }[]
      }
      can_access_clinical_content: { Args: never; Returns: boolean }
      can_access_configurations: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_access_patient_clinical_data: {
        Args: { _clinic_id: string; _patient_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_system: { Args: { _user_id: string }; Returns: boolean }
      can_manage_clinic: { Args: { _user_id: string }; Returns: boolean }
      can_manage_users: { Args: { _user_id: string }; Returns: boolean }
      can_professional_access_specialty: {
        Args: { _professional_id: string; _specialty_id: string }
        Returns: boolean
      }
      can_professional_access_template: {
        Args: { _professional_id: string; _template_specialty_id: string }
        Returns: boolean
      }
      can_professional_perform_procedure: {
        Args: { _procedure_id: string; _professional_id: string }
        Returns: boolean
      }
      can_professional_use_room: {
        Args: { _professional_id: string; _room_id: string }
        Returns: boolean
      }
      can_view_patient_clinical_history: {
        Args: { _user_id: string }
        Returns: boolean
      }
      cancel_sale_transaction: {
        Args: { p_reason?: string; p_sale_id: string; p_user_id: string }
        Returns: Json
      }
      check_medical_record_action_permission: {
        Args: { _action_key: string; _user_id: string }
        Returns: boolean
      }
      check_medical_record_tab_permission: {
        Args: { _permission: string; _tab_key: string; _user_id: string }
        Returns: boolean
      }
      create_professional_from_invitation: {
        Args: {
          p_clinic_id: string
          p_email: string
          p_full_name: string
          p_professional_type: string
          p_registration_number: string
          p_specialty_ids: string[]
          p_user_id: string
        }
        Returns: string
      }
      get_appointment_enabled_modules: {
        Args: { _appointment_id: string }
        Returns: {
          is_enabled: boolean
          module_category: string
          module_key: string
          module_name: string
        }[]
      }
      get_appointment_medical_record_context: {
        Args: { _appointment_id: string }
        Returns: {
          appointment_id: string
          can_professional_access: boolean
          is_specialty_enabled: boolean
          patient_id: string
          procedure_id: string
          procedure_name: string
          professional_id: string
          professional_name: string
          specialty_id: string
          specialty_key: string
          specialty_name: string
        }[]
      }
      get_appointment_specialty: {
        Args: { _appointment_id: string }
        Returns: string
      }
      get_next_document_number: {
        Args: { p_clinic_id: string }
        Returns: number
      }
      get_professional_primary_specialty: {
        Args: { _professional_id: string }
        Returns: string
      }
      get_professional_specialties: {
        Args: { _professional_id: string }
        Returns: {
          is_primary: boolean
          specialty_id: string
          specialty_name: string
        }[]
      }
      get_receptionist_allowed_modules: { Args: never; Returns: string[] }
      get_receptionist_blocked_modules: { Args: never; Returns: string[] }
      get_user_all_permissions: {
        Args: { _user_id: string }
        Returns: {
          actions: Database["public"]["Enums"]["app_action"][]
          module: Database["public"]["Enums"]["app_module"]
          restrictions: Json
        }[]
      }
      get_user_clinic: { Args: { _user_id: string }; Returns: string }
      get_user_clinic_id: { Args: never; Returns: string }
      get_user_email_for_admin: {
        Args: { _target_user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: string
      }
      get_user_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_type"]
      }
      has_attended_patient: {
        Args: { _patient_id: string; _professional_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_type: {
        Args: {
          _type: Database["public"]["Enums"]["user_type"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_clinic_admin: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      is_own_patient_data: { Args: { _patient_id: string }; Returns: boolean }
      is_procedure_specialty_enabled: {
        Args: { _clinic_id: string; _procedure_id: string }
        Returns: boolean
      }
      is_proprietario_admin: { Args: { _user_id: string }; Returns: boolean }
      is_recepcionista: { Args: never; Returns: boolean }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      log_button_action: {
        Args: {
          _action_data?: Json
          _action_target: string
          _action_type: string
        }
        Returns: undefined
      }
      log_clinical_access: {
        Args: { _action: string; _patient_id: string; _resource?: string }
        Returns: undefined
      }
      process_material_consumption: {
        Args: { p_appointment_id: string; p_materials?: Json }
        Returns: Json
      }
      process_procedure_product_consumption: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
      process_product_kit_consumption: {
        Args: {
          p_appointment_id: string
          p_kit_id: string
          p_kit_quantity?: number
        }
        Returns: Json
      }
      reset_anamnesis_templates: {
        Args: { p_clinic_id: string; p_user_id: string }
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
      validate_appointment_start: {
        Args: { _appointment_id: string; _user_id: string }
        Returns: string
      }
      validate_clinic_specialty: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: boolean
      }
      validate_professional_specialty: {
        Args: { _professional_id: string; _specialty_id: string }
        Returns: boolean
      }
      validate_specialty_alignment: {
        Args: {
          _clinic_id: string
          _professional_id: string
          _specialty_id: string
        }
        Returns: {
          error_code: string
          error_message: string
          is_valid: boolean
        }[]
      }
      validate_specialty_for_clinic: {
        Args: { _clinic_id: string; _specialty_id: string }
        Returns: boolean
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
        | "atendimento"
        | "meu_financeiro"
      app_role: "owner" | "admin" | "profissional" | "recepcionista"
      appointment_status:
        | "agendado"
        | "em_atendimento"
        | "finalizado"
        | "cancelado"
        | "faltou"
      appointment_type: "consulta" | "retorno" | "procedimento"
      clinical_document_type:
        | "anamnese"
        | "receita"
        | "atestado"
        | "evolucao"
        | "relatorio"
      clinical_module_category:
        | "clinical_record"
        | "documentation"
        | "assessment"
        | "visual"
        | "planning"
      fee_calculation_status: "pendente" | "calculado" | "pago" | "cancelado"
      specialty_type: "padrao" | "personalizada"
      tiss_guide_status:
        | "rascunho"
        | "aberta"
        | "enviada"
        | "aprovada"
        | "aprovada_parcial"
        | "negada"
        | "cancelada"
      tiss_guide_type:
        | "consulta"
        | "sp_sadt"
        | "internacao"
        | "honorarios"
        | "outras_despesas"
      tooth_status:
        | "healthy"
        | "caries"
        | "restoration"
        | "extraction"
        | "missing"
        | "implant"
        | "crown"
        | "endodontic"
        | "fracture"
        | "decay"
        | "sealant"
        | "prosthesis"
        | "bridge"
        | "veneer"
        | "other"
      user_type: "proprietario_admin" | "profissional_saude" | "recepcionista"
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
        "atendimento",
        "meu_financeiro",
      ],
      app_role: ["owner", "admin", "profissional", "recepcionista"],
      appointment_status: [
        "agendado",
        "em_atendimento",
        "finalizado",
        "cancelado",
        "faltou",
      ],
      appointment_type: ["consulta", "retorno", "procedimento"],
      clinical_document_type: [
        "anamnese",
        "receita",
        "atestado",
        "evolucao",
        "relatorio",
      ],
      clinical_module_category: [
        "clinical_record",
        "documentation",
        "assessment",
        "visual",
        "planning",
      ],
      fee_calculation_status: ["pendente", "calculado", "pago", "cancelado"],
      specialty_type: ["padrao", "personalizada"],
      tiss_guide_status: [
        "rascunho",
        "aberta",
        "enviada",
        "aprovada",
        "aprovada_parcial",
        "negada",
        "cancelada",
      ],
      tiss_guide_type: [
        "consulta",
        "sp_sadt",
        "internacao",
        "honorarios",
        "outras_despesas",
      ],
      tooth_status: [
        "healthy",
        "caries",
        "restoration",
        "extraction",
        "missing",
        "implant",
        "crown",
        "endodontic",
        "fracture",
        "decay",
        "sealant",
        "prosthesis",
        "bridge",
        "veneer",
        "other",
      ],
      user_type: ["proprietario_admin", "profissional_saude", "recepcionista"],
    },
  },
} as const
