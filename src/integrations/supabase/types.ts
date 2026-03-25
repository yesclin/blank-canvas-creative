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
          appointment_type: string
          arrived_at: string | null
          cancellation_reason: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          duration_minutes: number
          end_time: string
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
      clinics: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          opening_hours: Json | null
          phone: string | null
          primary_specialty_id: string | null
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
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          primary_specialty_id?: string | null
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
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          primary_specialty_id?: string | null
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
      insurances: {
        Row: {
          ans_code: string | null
          clinic_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          ans_code?: string | null
          clinic_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          ans_code?: string | null
          clinic_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
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
          id: string
          insurance_id: string
          is_active: boolean
          patient_id: string
          plan_name: string | null
          updated_at: string
          validity_date: string | null
        }
        Insert: {
          card_number?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          insurance_id: string
          is_active?: boolean
          patient_id: string
          plan_name?: string | null
          updated_at?: string
          validity_date?: string | null
        }
        Update: {
          card_number?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          insurance_id?: string
          is_active?: boolean
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
          notes: string | null
          phone: string | null
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
          notes?: string | null
          phone?: string | null
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
          notes?: string | null
          phone?: string | null
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
      schedule_blocks: {
        Row: {
          all_day: boolean
          clinic_id: string
          created_at: string
          end_date: string
          end_time: string | null
          id: string
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
      get_user_all_permissions: {
        Args: { _user_id: string }
        Returns: {
          actions: Database["public"]["Enums"]["app_action"][]
          module: Database["public"]["Enums"]["app_module"]
          restrictions: Json
        }[]
      }
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
      user_clinic_id: { Args: { _user_id: string }; Returns: string }
      user_has_module_permission: {
        Args: {
          _action?: Database["public"]["Enums"]["app_action"]
          _module: Database["public"]["Enums"]["app_module"]
          _user_id: string
        }
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
