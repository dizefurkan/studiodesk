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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attendances: {
        Row: {
          created_at: string
          deduct_credits: boolean
          id: string
          is_present: boolean
          notes: string | null
          session_id: string
          student_id: string
          student_package_id: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deduct_credits?: boolean
          id?: string
          is_present?: boolean
          notes?: string | null
          session_id: string
          student_id: string
          student_package_id: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deduct_credits?: boolean
          id?: string
          is_present?: boolean
          notes?: string | null
          session_id?: string
          student_id?: string
          student_package_id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_package_id_fkey"
            columns: ["student_package_id"]
            isOneToOne: false
            referencedRelation: "student_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_instructors: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          instructor_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          instructor_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          instructor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_instructors_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          branch_id: string
          created_at: string
          description: string
          id: string
          student_package_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id: string
          created_at?: string
          description: string
          id?: string
          student_package_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string
          created_at?: string
          description?: string
          id?: string
          student_package_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_student_package_id_fkey"
            columns: ["student_package_id"]
            isOneToOne: false
            referencedRelation: "student_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          course_id: string
          created_at: string
          id: string
          instructor_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          instructor_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          instructor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          course_id: string
          created_at: string
          id: string
          notes: string | null
          session_date: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_students: {
        Row: {
          course_id: string
          created_at: string
          id: string
          joined_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          joined_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          branch_id: string
          created_at: string
          dance_type_id: string
          day_of_week: number
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          end_time: string
          id: string
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          dance_type_id: string
          day_of_week: number
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          end_time: string
          id?: string
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          dance_type_id?: string
          day_of_week?: number
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_dance_type_id_fkey"
            columns: ["dance_type_id"]
            isOneToOne: false
            referencedRelation: "dance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dance_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dance_types_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dance_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          locale: string
          message: string | null
          name: string
          phone: string
          status: string
          student_count: string | null
          studio_name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          locale?: string
          message?: string | null
          name: string
          phone: string
          status?: string
          student_count?: string | null
          studio_name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          locale?: string
          message?: string | null
          name?: string
          phone?: string
          status?: string
          student_count?: string | null
          studio_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      history_logs: {
        Row: {
          action: string
          created_at: string
          data: Json | null
          entity: string
          entity_id: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          data?: Json | null
          entity: string
          entity_id: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json | null
          entity?: string
          entity_id?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "history_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_adjustments: {
        Row: {
          amount: number
          applies_on: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instructor_id: string
          kind: string
          organization_id: string
          source_session_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          applies_on: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id: string
          kind: string
          organization_id: string
          source_session_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          applies_on?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_id?: string
          kind?: string
          organization_id?: string
          source_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_adjustments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_adjustments_source_session_id_fkey"
            columns: ["source_session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_earnings: {
        Row: {
          amount: number
          breakdown: Json | null
          calculated_amount: number | null
          created_at: string
          earned_on: string
          id: string
          instructor_id: string
          is_manual: boolean
          session_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          breakdown?: Json | null
          calculated_amount?: number | null
          created_at?: string
          earned_on: string
          id?: string
          instructor_id: string
          is_manual?: boolean
          session_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          breakdown?: Json | null
          calculated_amount?: number | null
          created_at?: string
          earned_on?: string
          id?: string
          instructor_id?: string
          is_manual?: boolean
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_earnings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_earnings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_pay_periods: {
        Row: {
          closed_at: string
          closed_by: string | null
          created_at: string
          id: string
          organization_id: string
          period_month: string
          summary: Json | null
          updated_at: string
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          period_month: string
          summary?: Json | null
          updated_at?: string
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          period_month?: string
          summary?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_pay_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payouts: {
        Row: {
          amount: number
          branch_id: string
          cash_transaction_id: string | null
          created_at: string
          created_by: string | null
          id: string
          instructor_id: string
          method: string
          note: string | null
          organization_id: string
          paid_on: string
          updated_at: string
        }
        Insert: {
          amount: number
          branch_id: string
          cash_transaction_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_id: string
          method?: string
          note?: string | null
          organization_id: string
          paid_on: string
          updated_at?: string
        }
        Update: {
          amount?: number
          branch_id?: string
          cash_transaction_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instructor_id?: string
          method?: string
          note?: string | null
          organization_id?: string
          paid_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payouts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_cash_transaction_id_fkey"
            columns: ["cash_transaction_id"]
            isOneToOne: true
            referencedRelation: "cash_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_payouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_rate_versions: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          effective_from: string
          id: string
          min_amount: number | null
          pay_model: string
          rate_id: string
          ratio: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          effective_from: string
          id?: string
          min_amount?: number | null
          pay_model: string
          rate_id: string
          ratio?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          min_amount?: number | null
          pay_model?: string
          rate_id?: string
          ratio?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_rate_versions_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "instructor_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_rates: {
        Row: {
          amount: number | null
          branch_id: string
          created_at: string
          dance_type_id: string
          id: string
          instructor_id: string
          min_amount: number | null
          pay_model: string
          ratio_per_class: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          branch_id: string
          created_at?: string
          dance_type_id: string
          id?: string
          instructor_id: string
          min_amount?: number | null
          pay_model?: string
          ratio_per_class?: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          branch_id?: string
          created_at?: string
          dance_type_id?: string
          id?: string
          instructor_id?: string
          min_amount?: number | null
          pay_model?: string
          ratio_per_class?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_rates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_rates_dance_type_id_fkey"
            columns: ["dance_type_id"]
            isOneToOne: false
            referencedRelation: "dance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_rates_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructors_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          status: string
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
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          body: string
          channel: string
          created_at: string
          error: string | null
          id: string
          organization_id: string
          provider: string | null
          provider_message_id: string | null
          recipient: string
          sent_by: string | null
          status: string
          student_id: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          organization_id: string
          provider?: string | null
          provider_message_id?: string | null
          recipient: string
          sent_by?: string | null
          status?: string
          student_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          organization_id?: string
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string
          sent_by?: string | null
          status?: string
          student_id?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
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
      message_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allow_makeup_sessions: boolean | null
          allow_manager_invite: boolean | null
          allow_member_delete: boolean | null
          allow_role_change: boolean | null
          attendance_per_week_limit: number | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean
          name: string
          timezone: string | null
          updated_at: string
          virtual_sessions_weeks: number | null
          week_start_day: number | null
        }
        Insert: {
          allow_makeup_sessions?: boolean | null
          allow_manager_invite?: boolean | null
          allow_member_delete?: boolean | null
          allow_role_change?: boolean | null
          attendance_per_week_limit?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          name: string
          timezone?: string | null
          updated_at?: string
          virtual_sessions_weeks?: number | null
          week_start_day?: number | null
        }
        Update: {
          allow_makeup_sessions?: boolean | null
          allow_manager_invite?: boolean | null
          allow_member_delete?: boolean | null
          allow_role_change?: boolean | null
          attendance_per_week_limit?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          name?: string
          timezone?: string | null
          updated_at?: string
          virtual_sessions_weeks?: number | null
          week_start_day?: number | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          dance_type_id: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          id: string
          name: string
          organization_id: string
          price: number
          total_credits: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dance_type_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          name: string
          organization_id: string
          price: number
          total_credits: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dance_type_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          id?: string
          name?: string
          organization_id?: string
          price?: number
          total_credits?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_dance_type_id_fkey"
            columns: ["dance_type_id"]
            isOneToOne: false
            referencedRelation: "dance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_instructors: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_instructors_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_packages: {
        Row: {
          created_at: string
          expire_date: string | null
          id: string
          package_id: string
          purchase_date: string
          remaining_credits: number
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expire_date?: string | null
          id?: string
          package_id: string
          purchase_date?: string
          remaining_credits: number
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expire_date?: string | null
          id?: string
          package_id?: string
          purchase_date?: string
          remaining_credits?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_packages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deleted_reason: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          messages_opt_out: boolean
          notes: string | null
          organization_id: string
          phone: string | null
          status_changed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          messages_opt_out?: boolean
          notes?: string | null
          organization_id: string
          phone?: string | null
          status_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_reason?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          messages_opt_out?: boolean
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status_changed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          branch_id: string
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      branch_org_id: { Args: { p_branch_id: string }; Returns: string }
      course_org_id: { Args: { p_course_id: string }; Returns: string }
      course_profitability: {
        Args: {
          p_branch_id?: string
          p_from: string
          p_organization_id: string
          p_to: string
        }
        Returns: {
          branch_name: string
          course_id: string
          course_name: string
          credit_count: number
          dance_type_name: string
          instructor_cost: number
          present_count: number
          revenue: number
          session_count: number
        }[]
      }
      get_user_organization_id: { Args: never; Returns: string }
      instructor_org_id: { Args: { p_instructor_id: string }; Returns: string }
      instructor_pay_balances: {
        Args: { p_from: string; p_organization_id: string; p_to: string }
        Returns: {
          adjustments: number
          earned: number
          instructor_id: string
          lesson_count: number
          opening: number
          paid: number
        }[]
      }
      session_org_id: { Args: { p_session_id: string }; Returns: string }
      student_org_id: { Args: { p_student_id: string }; Returns: string }
      user_co_member_ids: { Args: never; Returns: string[] }
      user_org_ids: { Args: never; Returns: string[] }
      user_org_ids_with_role: { Args: { roles: string[] }; Returns: string[] }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
