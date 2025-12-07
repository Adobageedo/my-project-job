/**
 * Client Supabase
 * Configuration et initialisation du client Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Client Supabase singleton
 * Utilisé pour toutes les opérations DB, Auth et Storage
 * Note: En mode mock (sans credentials), le client est créé avec des placeholders
 * mais les services utilisent les données mockées à la place
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Vérifier si Supabase est configuré
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export default supabase;
