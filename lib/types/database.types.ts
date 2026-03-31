export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_users: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'manager' | 'instructor' | 'staff'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'manager' | 'instructor' | 'staff'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'manager' | 'instructor' | 'staff'
          created_at?: string
          updated_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instructors: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          phone: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          first_name: string
          last_name: string
          phone?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      branch_instructors: {
        Row: {
          id: string
          branch_id: string
          instructor_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          instructor_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          branch_id?: string
          instructor_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          phone: string | null
          email: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          first_name: string
          last_name: string
          phone?: string | null
          email: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          email?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dance_types: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instructor_rates: {
        Row: {
          id: string
          instructor_id: string
          branch_id: string
          dance_type_id: string
          ratio_per_class: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          branch_id: string
          dance_type_id: string
          ratio_per_class: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          branch_id?: string
          dance_type_id?: string
          ratio_per_class?: number
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          branch_id: string
          dance_type_id: string
          name: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          dance_type_id: string
          name: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          branch_id?: string
          dance_type_id?: string
          name?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      course_instructors: {
        Row: {
          id: string
          course_id: string
          instructor_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          instructor_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          instructor_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      course_sessions: {
        Row: {
          id: string
          course_id: string
          session_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          session_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          session_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      session_instructors: {
        Row: {
          id: string
          session_id: string
          instructor_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          instructor_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          instructor_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          organization_id: string
          dance_type_id: string
          name: string
          total_credits: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          dance_type_id: string
          name: string
          total_credits: number
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          dance_type_id?: string
          name?: string
          total_credits?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      student_packages: {
        Row: {
          id: string
          student_id: string
          package_id: string
          remaining_credits: number
          purchase_date: string
          expire_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          package_id: string
          remaining_credits: number
          purchase_date: string
          expire_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          package_id?: string
          remaining_credits?: number
          purchase_date?: string
          expire_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendances: {
        Row: {
          id: string
          session_id: string
          student_id: string
          student_package_id: string
          studio_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          student_package_id: string
          studio_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          student_package_id?: string
          studio_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      instructor_earnings: {
        Row: {
          id: string
          instructor_id: string
          session_id: string
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          session_id: string
          amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          session_id?: string
          amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      cash_transactions: {
        Row: {
          id: string
          branch_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          student_package_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          type: 'income' | 'expense'
          amount: number
          description: string
          student_package_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          branch_id?: string
          type?: 'income' | 'expense'
          amount?: number
          description?: string
          student_package_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      history_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string
          data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action: string
          entity: string
          entity_id: string
          data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string
          data?: Record<string, unknown> | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'owner' | 'manager' | 'instructor' | 'staff'
      transaction_type: 'income' | 'expense'
    }
    CompositeTypes: Record<string, never>
  }
}
