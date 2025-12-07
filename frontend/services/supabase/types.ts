/**
 * Types générés pour Supabase Database
 * Ces types correspondent au schéma de votre base de données Supabase
 * 
 * Pour générer automatiquement ces types depuis votre DB :
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > services/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Table des candidats
      candidates: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          school: string;
          study_level: 'L3' | 'M1' | 'M2' | 'MBA';
          specialization: string;
          alternance_rhythm: string | null;
          locations: string[];
          available_from: string;
          cv_url: string | null;
          cv_parsed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          school: string;
          study_level: 'L3' | 'M1' | 'M2' | 'MBA';
          specialization: string;
          alternance_rhythm?: string | null;
          locations: string[];
          available_from: string;
          cv_url?: string | null;
          cv_parsed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          school?: string;
          study_level?: 'L3' | 'M1' | 'M2' | 'MBA';
          specialization?: string;
          alternance_rhythm?: string | null;
          locations?: string[];
          available_from?: string;
          cv_url?: string | null;
          cv_parsed?: boolean;
          updated_at?: string;
        };
      };

      // Table des entreprises
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sector: string;
          size: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          logo_url: string | null;
          roles: string[];
          recruit_crm_id: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sector: string;
          size: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          logo_url?: string | null;
          roles: string[];
          recruit_crm_id?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sector?: string;
          size?: string;
          contact_name?: string;
          contact_email?: string;
          contact_phone?: string;
          logo_url?: string | null;
          roles?: string[];
          recruit_crm_id?: string | null;
          last_synced_at?: string | null;
          updated_at?: string;
        };
      };

      // Table des offres d'emploi
      job_offers: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string;
          missions: string[];
          objectives: string;
          reporting: string;
          study_level: string[];
          skills: string[];
          contract_type: 'stage' | 'alternance' | 'apprentissage';
          duration: string;
          start_date: string;
          location: string;
          salary: string | null;
          application_process: string;
          status: 'active' | 'filled' | 'expired';
          posted_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          description: string;
          missions: string[];
          objectives: string;
          reporting: string;
          study_level: string[];
          skills: string[];
          contract_type: 'stage' | 'alternance' | 'apprentissage';
          duration: string;
          start_date: string;
          location: string;
          salary?: string | null;
          application_process: string;
          status?: 'active' | 'filled' | 'expired';
          posted_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string;
          missions?: string[];
          objectives?: string;
          reporting?: string;
          study_level?: string[];
          skills?: string[];
          contract_type?: 'stage' | 'alternance' | 'apprentissage';
          duration?: string;
          start_date?: string;
          location?: string;
          salary?: string | null;
          application_process?: string;
          status?: 'active' | 'filled' | 'expired';
          updated_at?: string;
        };
      };

      // Table des candidatures
      applications: {
        Row: {
          id: string;
          candidate_id: string;
          offer_id: string;
          company_id: string;
          application_date: string;
          status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
          cover_letter: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          offer_id: string;
          company_id: string;
          application_date?: string;
          status?: 'pending' | 'reviewing' | 'accepted' | 'rejected';
          cover_letter?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          offer_id?: string;
          company_id?: string;
          status?: 'pending' | 'reviewing' | 'accepted' | 'rejected';
          cover_letter?: string | null;
          updated_at?: string;
        };
      };

      // Table des audit logs
      audit_logs: {
        Row: {
          id: string;
          action: string;
          user_id: string;
          user_name: string;
          user_email: string;
          user_role: string;
          timestamp: string;
          details: string;
          ip_address: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          action: string;
          user_id: string;
          user_name: string;
          user_email: string;
          user_role: string;
          timestamp?: string;
          details: string;
          ip_address?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          action?: string;
          user_id?: string;
          user_name?: string;
          user_email?: string;
          user_role?: string;
          details?: string;
          ip_address?: string | null;
          metadata?: Json | null;
        };
      };

      // Table des demandes RGPD
      gdpr_requests: {
        Row: {
          id: string;
          user_id: string;
          user_email: string;
          request_type: 'access' | 'modify' | 'delete' | 'export';
          status: 'pending' | 'in_progress' | 'completed' | 'rejected';
          request_date: string;
          completed_date: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_email: string;
          request_type: 'access' | 'modify' | 'delete' | 'export';
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
          request_date?: string;
          completed_date?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_email?: string;
          request_type?: 'access' | 'modify' | 'delete' | 'export';
          status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
          completed_date?: string | null;
          notes?: string | null;
        };
      };

      // Table des paramètres de notification
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          notify_new_applications: boolean;
          notify_new_offers: boolean;
          notify_status_change: boolean;
          frequency: 'instant' | 'daily' | 'weekly';
          email_from: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notify_new_applications?: boolean;
          notify_new_offers?: boolean;
          notify_status_change?: boolean;
          frequency?: 'instant' | 'daily' | 'weekly';
          email_from?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notify_new_applications?: boolean;
          notify_new_offers?: boolean;
          notify_status_change?: boolean;
          frequency?: 'instant' | 'daily' | 'weekly';
          email_from?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      study_level: 'L3' | 'M1' | 'M2' | 'MBA';
      contract_type: 'stage' | 'alternance' | 'apprentissage';
      application_status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
      offer_status: 'active' | 'filled' | 'expired';
      user_role: 'candidate' | 'company' | 'hr' | 'manager' | 'admin';
      gdpr_request_type: 'access' | 'modify' | 'delete' | 'export';
      gdpr_status: 'pending' | 'in_progress' | 'completed' | 'rejected';
      notification_frequency: 'instant' | 'daily' | 'weekly';
    };
  };
}

// Types utilitaires pour faciliter l'utilisation
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Alias pour les tables principales
export type CandidateRow = Tables<'candidates'>;
export type CompanyRow = Tables<'companies'>;
export type JobOfferRow = Tables<'job_offers'>;
export type ApplicationRow = Tables<'applications'>;
export type AuditLogRow = Tables<'audit_logs'>;
export type GDPRRequestRow = Tables<'gdpr_requests'>;
export type NotificationSettingsRow = Tables<'notification_settings'>;
