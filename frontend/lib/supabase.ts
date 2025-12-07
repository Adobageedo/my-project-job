import { createClient } from '@supabase/supabase-js';

// Types pour la database
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          roles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          roles: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
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
          cv_parsed: boolean | null;
          search_type: 'stage' | 'alternance' | 'both';
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          bio?: string | null;
          skills?: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['candidates']['Row'], 'id' | 'created_at' | 'updated_at' | 'cv_parsed'>;
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>;
      };
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
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_synced_at'>;
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      job_offers: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string;
          missions: string[];
          objectives: string;
          reporting: string | null;
          study_level: ('L3' | 'M1' | 'M2' | 'MBA')[];
          skills: string[];
          contract_type: 'stage' | 'alternance' | 'apprentissage';
          duration: string;
          start_date: string;
          location: string;
          salary: string | null;
          application_process: string;
          status: 'active' | 'filled' | 'expired';
          posted_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['job_offers']['Row'], 'id' | 'created_at' | 'updated_at' | 'posted_date'>;
        Update: Partial<Database['public']['Tables']['job_offers']['Insert']>;
      };
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
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at' | 'application_date'>;
        Update: Partial<Database['public']['Tables']['applications']['Insert']>;
      };
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
        Insert: Omit<Database['public']['Tables']['notification_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['notification_settings']['Insert']>;
      };
    };
  };
};

// Client Supabase singleton
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Client pour server-side (avec service role key si besoin)
export const createServerClient = () => {
  return supabase;
};

// Helper pour upload de fichiers
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}

// Helper pour download de fichiers
export async function getFileUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

// Helper pour delete de fichiers
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return !error;
  } catch {
    return false;
  }
}
