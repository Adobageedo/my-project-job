/**
 * Export centralisé de tous les services
 * Facilite l'import dans les composants
 * 
 * Backend: Supabase (Auth, Database, Storage)
 */

// Services principaux
export * from './authService';
export * from './candidateService';
export * from './companyService';
export * from './offerService';
export * from './adminService';

// Application service (explicit exports to avoid conflicts with candidateService)
export {
  getCandidateApplications,
  getApplicationById,
  getApplicationForOffer,
  withdrawApplication as withdrawCandidateApplication,
  deleteApplication,
  getCandidateApplicationStats,
  hasAppliedToOffer,
  type FrontendApplication,
  type ApplicationStatus as AppStatus,
} from './applicationService';

// Saved offers service (explicit exports to avoid conflicts with candidateService)
export {
  getSavedOffers as getCandidateSavedOffers,
  saveOffer as saveCandidateOffer,
  unsaveOffer as unsaveCandidateOffer,
  updateSavedOfferNotes,
  isOfferSaved,
  toggleSaveOffer,
  getSavedOffersCount,
  type FrontendSavedOffer,
} from './savedOfferService';

// Notifications (explicit exports to avoid conflicts)
export {
  getNotificationSettings,
  sendEmail,
  notifyNewApplication,
  notifyNewOffer,
  notifyApplicationStatusChange,
} from './notificationsService';

// Configuration API
export { API_CONFIG, isSupabaseReady } from './api/config';
export { apiClient, APIError } from './api/client';

// Client Supabase (pour usage avancé)
export { supabase, isSupabaseConfigured } from './supabase/client';

/**
 * Exemple d'utilisation dans un composant :
 * 
 * import { 
 *   login, 
 *   searchOffers, 
 *   getCurrentCandidate,
 *   applyToOffer 
 * } from '@/services';
 * 
 * // Authentification
 * const handleLogin = async () => {
 *   const result = await login({ email, password });
 * };
 * 
 * // Recherche d'offres
 * const loadOffers = async () => {
 *   const { offers, total } = await searchOffers({ contract_types: ['stage'] });
 * };
 * 
 * // Profil candidat
 * const loadProfile = async () => {
 *   const candidate = await getCurrentCandidate();
 * };
 */
