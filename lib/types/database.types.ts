export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          registration_number: string
          registered_address: string
          company_type: string
          incorporation_date: string
          authorised_capital: number | null
          paid_up_capital: number | null
          face_value_per_share: number | null
          main_objects: string | null
          financial_year: string | null
          logo_url: string | null
          status: 'draft' | 'live' | 'suspended'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number: string
          registered_address: string
          company_type: string
          incorporation_date: string
          authorised_capital?: number | null
          paid_up_capital?: number | null
          face_value_per_share?: number | null
          main_objects?: string | null
          financial_year?: string | null
          logo_url?: string | null
          status?: 'draft' | 'live' | 'suspended'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          registration_number?: string
          registered_address?: string
          company_type?: string
          incorporation_date?: string
          authorised_capital?: number | null
          paid_up_capital?: number | null
          face_value_per_share?: number | null
          main_objects?: string | null
          financial_year?: string | null
          logo_url?: string | null
          status?: 'draft' | 'live' | 'suspended'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'md' | 'secretary' | 'director'
          company_id: string | null
          account_status: 'pending' | 'active' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'md' | 'secretary' | 'director'
          company_id?: string | null
          account_status?: 'pending' | 'active' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'md' | 'secretary' | 'director'
          company_id?: string | null
          account_status?: 'pending' | 'active' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      director_profiles: {
        Row: {
          id: string
          user_id: string | null
          company_id: string | null
          designation: string
          nid_number_encrypted: string | null
          passport_number_encrypted: string | null
          share_count: number
          share_percentage: number
          appointment_date: string
          resignation_date: string | null
          status: 'current' | 'former'
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_id?: string | null
          designation: string
          nid_number_encrypted?: string | null
          passport_number_encrypted?: string | null
          share_count?: number
          share_percentage?: number
          appointment_date: string
          resignation_date?: string | null
          status?: 'current' | 'former'
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          company_id?: string | null
          designation?: string
          nid_number_encrypted?: string | null
          passport_number_encrypted?: string | null
          share_count?: number
          share_percentage?: number
          appointment_date?: string
          resignation_date?: string | null
          status?: 'current' | 'former'
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          company_id: string | null
          document_type: 'moa' | 'aoa' | 'form_xii' | 'schedule_x' | 'other'
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string | null
          extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          document_type: 'moa' | 'aoa' | 'form_xii' | 'schedule_x' | 'other'
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by?: string | null
          extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          document_type?: 'moa' | 'aoa' | 'form_xii' | 'schedule_x' | 'other'
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string | null
          extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
      }
      extracted_fields: {
        Row: {
          id: string
          document_id: string | null
          field_name: string
          field_value: string | null
          confidence_score: number | null
          source_page: number | null
          status: 'matched' | 'conflict' | 'needs_confirmation'
          confirmed_value: string | null
          confirmed_by: string | null
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id?: string | null
          field_name: string
          field_value?: string | null
          confidence_score?: number | null
          source_page?: number | null
          status?: 'matched' | 'conflict' | 'needs_confirmation'
          confirmed_value?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string | null
          field_name?: string
          field_value?: string | null
          confidence_score?: number | null
          source_page?: number | null
          status?: 'matched' | 'conflict' | 'needs_confirmation'
          confirmed_value?: string | null
          confirmed_by?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: 'md' | 'secretary' | 'director'
          company_id: string | null
          invited_by: string | null
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'md' | 'secretary' | 'director'
          company_id?: string | null
          invited_by?: string | null
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'md' | 'secretary' | 'director'
          company_id?: string | null
          invited_by?: string | null
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          company_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          company_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}
