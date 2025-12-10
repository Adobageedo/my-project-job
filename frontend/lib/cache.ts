/**
 * Cache Manager - Système de cache frontend avec durées variables
 * 
 * Durées de cache recommandées:
 * - Données utilisateur (profil): 5 min (modifié fréquemment)
 * - Données candidat: 5 min
 * - Données entreprise: 10 min
 * - Liste des offres: 2 min (change souvent)
 * - Détail d'une offre: 5 min
 * - Données statiques (localisations, etc.): 1 heure
 * - Homepage offers: 5 min
 */

// Types de données avec leurs durées de cache en millisecondes
export const CACHE_DURATIONS = {
  // Données utilisateur - courte durée car modifiées fréquemment
  USER_PROFILE: 5 * 60 * 1000,        // 5 minutes
  CANDIDATE_PROFILE: 5 * 60 * 1000,   // 5 minutes
  COMPANY_PROFILE: 10 * 60 * 1000,    // 10 minutes
  
  // Listes - très courte durée car changent souvent
  OFFERS_LIST: 2 * 60 * 1000,         // 2 minutes
  APPLICATIONS_LIST: 2 * 60 * 1000,   // 2 minutes
  CANDIDATES_LIST: 3 * 60 * 1000,     // 3 minutes
  
  // Détails - durée moyenne
  OFFER_DETAIL: 5 * 60 * 1000,        // 5 minutes
  APPLICATION_DETAIL: 3 * 60 * 1000,  // 3 minutes
  
  // Données semi-statiques
  HOMEPAGE_OFFERS: 5 * 60 * 1000,     // 5 minutes
  NOTIFICATION_SETTINGS: 10 * 60 * 1000, // 10 minutes
  
  // Données statiques - longue durée
  LOCATIONS: 60 * 60 * 1000,          // 1 heure
  STATIC_DATA: 60 * 60 * 1000,        // 1 heure
} as const;

export type CacheKey = keyof typeof CACHE_DURATIONS;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheStore {
  [key: string]: CacheEntry<unknown>;
}

// Préfixe pour le localStorage
const CACHE_PREFIX = 'jt_cache_';

/**
 * Récupère une entrée du cache
 */
export function getFromCache<T>(key: string, type: CacheKey): T | null {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    const stored = localStorage.getItem(fullKey);
    
    if (!stored) return null;
    
    const entry: CacheEntry<T> = JSON.parse(stored);
    const now = Date.now();
    
    // Vérifier si le cache est expiré
    if (now > entry.expiresAt) {
      localStorage.removeItem(fullKey);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn(`[Cache] Error reading ${key}:`, error);
    return null;
  }
}

/**
 * Stocke une entrée dans le cache
 */
export function setInCache<T>(key: string, type: CacheKey, data: T): void {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    const duration = CACHE_DURATIONS[type];
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + duration,
    };
    
    localStorage.setItem(fullKey, JSON.stringify(entry));
  } catch (error) {
    console.warn(`[Cache] Error writing ${key}:`, error);
    // Si le localStorage est plein, nettoyer les anciennes entrées
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearExpiredCache();
    }
  }
}

/**
 * Invalide une entrée du cache
 */
export function invalidateCache(key: string): void {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.warn(`[Cache] Error invalidating ${key}:`, error);
  }
}

/**
 * Invalide toutes les entrées correspondant à un pattern
 */
export function invalidateCachePattern(pattern: string): void {
  try {
    const keys = Object.keys(localStorage);
    const fullPattern = `${CACHE_PREFIX}${pattern}`;
    
    keys.forEach(key => {
      if (key.startsWith(fullPattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn(`[Cache] Error invalidating pattern ${pattern}:`, error);
  }
}

/**
 * Nettoie les entrées expirées du cache
 */
export function clearExpiredCache(): void {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry<unknown> = JSON.parse(stored);
            if (now > entry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // Si on ne peut pas parser, supprimer
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('[Cache] Error clearing expired cache:', error);
  }
}

/**
 * Vide tout le cache
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[Cache] Error clearing all cache:', error);
  }
}

// =====================================================
// HOOKS ET HELPERS SPÉCIFIQUES
// =====================================================

/**
 * Cache keys pour les différentes entités
 */
export const cacheKeys = {
  userProfile: (userId: string) => `user_${userId}`,
  candidateProfile: (userId: string) => `candidate_${userId}`,
  companyProfile: (companyId: string) => `company_${companyId}`,
  offersList: (filters?: string) => `offers_list_${filters || 'all'}`,
  offerDetail: (offerId: string) => `offer_${offerId}`,
  applicationsList: (userId: string) => `applications_${userId}`,
  applicationDetail: (appId: string) => `application_${appId}`,
  candidatesList: (companyId: string, filters?: string) => `candidates_${companyId}_${filters || 'all'}`,
  homepageOffers: () => 'homepage_offers',
  notificationSettings: (userId: string) => `notifications_${userId}`,
};

/**
 * Invalide le cache lié à un utilisateur (après modification du profil)
 */
export function invalidateUserCache(userId: string): void {
  invalidateCache(cacheKeys.userProfile(userId));
  invalidateCache(cacheKeys.candidateProfile(userId));
  invalidateCache(cacheKeys.applicationsList(userId));
  invalidateCache(cacheKeys.notificationSettings(userId));
}

/**
 * Invalide le cache lié à une entreprise
 */
export function invalidateCompanyCache(companyId: string): void {
  invalidateCache(cacheKeys.companyProfile(companyId));
  invalidateCachePattern(`candidates_${companyId}`);
  invalidateCachePattern('offers_list'); // Les offres peuvent avoir changé
}

/**
 * Invalide le cache des offres (après création/modification)
 */
export function invalidateOffersCache(): void {
  invalidateCachePattern('offers_list');
  invalidateCachePattern('offer_');
  invalidateCache(cacheKeys.homepageOffers());
}

/**
 * Invalide le cache des candidatures
 */
export function invalidateApplicationsCache(userId?: string): void {
  if (userId) {
    invalidateCache(cacheKeys.applicationsList(userId));
  }
  invalidateCachePattern('application_');
}

// Nettoyer le cache expiré au démarrage
if (typeof window !== 'undefined') {
  clearExpiredCache();
}
