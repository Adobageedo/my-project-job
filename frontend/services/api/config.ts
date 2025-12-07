/**
 * Configuration centrale de l'API
 * Toutes les URLs et paramètres de configuration sont centralisés ici
 */

export const API_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Backend API (Railway) pour les fonctions avancées
  BACKEND_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  
  // Storage buckets
  STORAGE: {
    CV_BUCKET: 'cvs',
    LOGOS_BUCKET: 'logos',
    DOCUMENTS_BUCKET: 'documents',
  },
  
  // Timeouts
  TIMEOUT: 30000, // 30 secondes
  
  // Mode production : utiliser Supabase + Backend uniquement
  USE_MOCK: false,
};

/**
 * Vérifier si Supabase est configuré
 */
export const isSupabaseReady = (): boolean => {
  return !!(API_CONFIG.SUPABASE_URL && API_CONFIG.SUPABASE_ANON_KEY);
};

export default API_CONFIG;
