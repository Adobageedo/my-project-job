// Types pour la plateforme de stages en finance

export type UserRole = 'candidate' | 'company' | 'hr' | 'manager' | 'admin';

export type ApplicationStatus = 'pending' | 'reviewing' | 'rejected' | 'accepted';

export type StudyLevel = 'L3' | 'M1' | 'M2' | 'MBA';

export type ContractType = 'stage' | 'alternance' | 'apprentissage';

// =====================================================
// LOCALISATION UNIFIÉE
// =====================================================

/**
 * Structure de localisation hiérarchique : Ville → Région → Pays
 */
export interface Location {
  city: string;           // Ville (ex: "Paris")
  region: string;         // Région (ex: "Île-de-France")
  country: string;        // Pays (ex: "France")
  postalCode?: string;    // Code postal optionnel
}

/**
 * Données de référence pour les localisations françaises
 */
export const FRENCH_REGIONS: Record<string, string[]> = {
  'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Versailles', 'Nanterre', 'Créteil', 'Neuilly-sur-Seine', 'La Défense'],
  'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Clermont-Ferrand', 'Annecy', 'Villeurbanne'],
  'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Cannes', 'Sophia-Antipolis'],
  'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'La Rochelle'],
  'Occitanie': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers'],
  'Hauts-de-France': ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque'],
  'Grand Est': ['Strasbourg', 'Reims', 'Metz', 'Nancy', 'Mulhouse'],
  'Pays de la Loire': ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire'],
  'Bretagne': ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes'],
  'Normandie': ['Rouen', 'Le Havre', 'Caen', 'Cherbourg'],
  'Centre-Val de Loire': ['Orléans', 'Tours', 'Bourges', 'Chartres'],
  'Bourgogne-Franche-Comté': ['Dijon', 'Besançon', 'Belfort', 'Auxerre'],
  'Corse': ['Ajaccio', 'Bastia'],
};

/**
 * Obtenir la région d'une ville
 */
export const getRegionFromCity = (city?: string | null): string => {
  if (!city) return 'Autre';
  for (const [region, cities] of Object.entries(FRENCH_REGIONS)) {
    if (cities.some(c => c.toLowerCase() === city.toLowerCase())) {
      return region;
    }
  }
  return 'Autre';
};

/**
 * Créer un objet Location à partir d'une ville
 */
export const createLocationFromCity = (city?: string | null, country: string = 'France'): Location => ({
  city: city || '',
  region: getRegionFromCity(city),
  country,
});

/**
 * Formater une location pour affichage
 */
export const formatLocation = (location: Location, format: 'full' | 'short' | 'city' = 'short'): string => {
  switch (format) {
    case 'full':
      return `${location.city}, ${location.region}, ${location.country}`;
    case 'short':
      return `${location.city}, ${location.region}`;
    case 'city':
      return location.city;
  }
};

// =====================================================
// CV MULTIPLES
// =====================================================

/**
 * CV sauvegardé par un candidat (max 5 par candidat)
 * Stocké dans la table candidate_cvs
 */
export interface SavedCV {
  id: string;
  userId: string;            // ID de l'utilisateur (anciennement candidateId)
  name: string;              // Nom donné par le candidat (ex: "CV Finance 2024")
  filename: string;          // Nom du fichier original
  url: string;               // URL du fichier (ou URL signée)
  storagePath: string;       // Chemin dans le bucket Storage (ex: "user-id/file.pdf")
  isDefault: boolean;        // CV par défaut
  fileSize?: number;         // Taille en bytes
  mimeType?: string;         // Type MIME (application/pdf)
  parsed?: boolean;          // Si le CV a été parsé par IA
  parsedData?: CVParseResult; // Données extraites par IA
  createdAt: string;         // Date de création
  updatedAt: string;         // Date de mise à jour
}

export type AuditLogAction = 
  | 'login' 
  | 'logout'
  | 'registration' 
  | 'profile_update'
  | 'application_created'
  | 'application_status_changed'
  | 'offer_created'
  | 'offer_updated'
  | 'offer_deleted'
  | 'user_suspended'
  | 'user_deleted'
  | 'cv_uploaded'
  | 'export_data';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  // Nom complet (optionnel, pour l'affichage)
  name?: string;
  // Rôles multiples éventuels (ex: company + hr + manager)
  roles?: UserRole[];
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school: string;
  studyLevel: StudyLevel;
  specialization: string;
  alternanceRhythm?: string;
  // Localisations souhaitées (nouveau format hiérarchique)
  preferredLocations?: Location[];
  // Legacy: string[] pour compatibilité avec anciennes données
  locations?: string[];
  availableFrom: string;
  // CV multiples
  savedCVs?: SavedCV[];
  defaultCVId?: string;
  // Legacy
  cvUrl?: string;
  cvParsed?: boolean;
  createdAt?: string;
}

export interface CompanyContact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'hr' | 'manager' | 'recruiter' | 'admin';
  department?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  size: 'startup' | 'pme' | 'eti' | 'grande_entreprise';
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  logo?: string;
  // Contact principal (legacy)
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  // Contacts multiples
  contacts?: CompanyContact[];
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
  status: 'active' | 'inactive' | 'pending';
  // Statistiques
  offersCount?: number;
  applicationsCount?: number;
}

export interface JobOffer {
  id: string;
  companyId: string;
  company: Company;
  title: string;
  description: string;
  missions: string[];
  objectives: string;
  reporting: string;
  studyLevel?: StudyLevel[];
  skills?: string[];
  // Supabase field for required skills (job_offers.required_skills)
  required_skills?: string[];
  contractType: ContractType;
  duration: string;
  startDate: string;
  // Localisation hiérarchique
  offerLocation?: Location;
  // Legacy: string pour compatibilité
  location: string;
  salary?: string;
  applicationProcess: string;
  postedDate: string;
  status: 'active' | 'filled' | 'expired';
}

export interface Application {
  id: string;
  candidateId: string;
  candidate: Candidate;
  offerId: string;
  offer: JobOffer;
  companyId: string;
  applicationDate: string;
  status: ApplicationStatus;
  coverLetter?: string;
  // CV utilisé pour cette candidature
  cvId?: string;
  cvUrl?: string;
  // Notes et historique
  notes?: ApplicationNote[];
  statusHistory?: ApplicationStatusChange[];
}

/**
 * Note sur une candidature
 */
export interface ApplicationNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isPrivate: boolean;
}

/**
 * Historique de changement de statut
 */
export interface ApplicationStatusChange {
  id: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface AdminStats {
  totalCandidates: number;
  totalCompanies: number;
  totalOffers: number;
  activeOffers: number;
  filledOffers: number;
  expiredOffers: number;
  totalApplications: number;
  recentActivity: ActivityLog[];
}

export interface AuditLog {
  id: string;
  action: AuditLogAction;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  timestamp: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface ActivityLog {
  id: string;
  type: 'login' | 'registration' | 'application' | 'offer_created';
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
  details: string;
}

// Nouveaux types pour fonctionnalités avancées

export interface RecruitCRMSync {
  id: string;
  entityType: 'candidate' | 'company' | 'offer' | 'application';
  entityId: string;
  recruitCRMId: string;
  lastSyncedAt: string;
  status: 'synced' | 'pending' | 'error';
  errorMessage?: string;
}

export interface MailingSettings {
  id: string;
  userId: string;
  notifyNewApplications: boolean;
  notifyNewOffers: boolean;
  notifyStatusChange: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  emailFrom: string;
}

export interface GDPRRequest {
  id: string;
  userId: string;
  userEmail: string;
  requestType: 'access' | 'modify' | 'delete' | 'export';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: string;
  completedDate?: string;
  notes?: string;
}

// Niveaux d'études pour le parsing CV
export type CVStudyLevel = 'bac' | 'bac+1' | 'bac+2' | 'bac+3' | 'bac+4' | 'bac+5' | 'bac+6' | 'doctorat';

export interface CVParseResult {
  firstName?: string;
  lastName?: string;
  phone?: string;
  school?: string;
  studyLevel?: CVStudyLevel;
  specialization?: string;
  locations?: string[];
  contractType?: 'stage' | 'alternance' | 'apprentissage';
  availableFrom?: string;
  skills?: string[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  bio?: string;
}

export interface ApplicationKanban {
  id: string;
  companyId: string;
  columns: KanbanColumn[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: ApplicationStatus;
  applications: Application[];
  order: number;
}

// SavedSearch type
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
}

// NotificationSettings type (simplifié)
export interface NotificationSettings {
  userId: string;
  emailMatchingOffers: boolean;      // Alertes pour les offres correspondant au profil
  emailApplicationUpdates: boolean;  // Notifications pour les changements de statut de candidatures
}
