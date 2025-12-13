import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface HeroSection {
  title: string;
  subtitle: string;
  description: string;
  showCandidateButton: boolean;
  showCompanyButton: boolean;
  candidateButtonText: string;
  companyButtonText: string;
}

export interface StatsSection {
  visible: boolean;
}

export interface OffersSection {
  visible: boolean;
  title: string;
  subtitle: string;
  showCount: number;
}

export interface AlternanceSection {
  visible: boolean;
  title: string;
  subtitle: string;
  benefits: string[];
}

export interface ServicesSection {
  visible: boolean;
  title: string;
  subtitle: string;
  services: {
    title: string;
    description: string;
    icon: string;
  }[];
  sectors: string[];
}

export interface FormationsSection {
  visible: boolean;
  title: string;
  subtitle: string;
  formations: {
    title: string;
    description: string;
  }[];
}

export interface AboutSection {
  visible: boolean;
  title: string;
  description: string;
  vision: string;
  cards: {
    title: string;
    description: string;
    icon: string;
  }[];
}

export interface HomepageConfig {
  id?: string;
  hero: HeroSection;
  stats: StatsSection;
  offers: OffersSection;
  alternance: AlternanceSection;
  services: ServicesSection;
  formations: FormationsSection;
  about: AboutSection;
  updated_at?: string;
  updated_by?: string;
}

// =====================================================
// DEFAULT CONFIG
// =====================================================

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  hero: {
    title: 'Créateur de rencontres professionnelles',
    subtitle: 'Conception et déploiement de solutions innovantes en ressources humaines',
    description: 'Chaque histoire est différente, construisons-en une qui vous ressemble.',
    showCandidateButton: true,
    showCompanyButton: true,
    candidateButtonText: 'Je suis candidat',
    companyButtonText: 'Je suis entreprise',
  },
  stats: {
    visible: true,
  },
  offers: {
    visible: true,
    title: 'Opportunités professionnelles',
    subtitle: 'Découvrez les opportunités les plus récentes dans les meilleures entreprises de finance',
    showCount: 5,
  },
  alternance: {
    visible: true,
    title: 'Recrutez vos alternants et stagiaires en 3 clics',
    subtitle: 'Spécialistes du recrutement de profils juniors en finance d\'entreprise et de marché',
    benefits: [
      'Profils pré-qualifiés des meilleures écoles',
      'Recrutement en moins de 2 semaines',
      'Accompagnement personnalisé',
    ],
  },
  services: {
    visible: true,
    title: 'Services aux entreprises',
    subtitle: 'Des solutions personnalisables pour répondre à tous vos besoins en recrutement et gestion des talents.',
    services: [
      { title: 'Chasse & recrutement', description: 'Profils finance d\'entreprise et de marché, du junior au senior', icon: 'Target' },
      { title: 'Recrutement externalisé (RPO)', description: 'Externalisation complète ou partielle de votre processus de recrutement', icon: 'Users' },
      { title: 'Évaluation de profils', description: 'Assessment et évaluation de vos candidats financiers', icon: 'Briefcase' },
      { title: 'Direction financière à temps partagé', description: 'DAF externalisé pour accompagner votre croissance', icon: 'Handshake' },
    ],
    sectors: [
      'Banque & Assurance', 'Gestion d\'actifs', 'Private Equity', 'Industrie',
      'Services', 'Technologie', 'Conseil', 'Santé', 'Luxe', 'Télécom', 'BTP', 'Biomédical',
    ],
  },
  formations: {
    visible: true,
    title: 'Formations & accompagnement',
    subtitle: 'Vous recherchez une nouvelle opportunité ? Vous avez besoin d\'accompagnement dans la gestion de votre carrière ? Découvrez nos offres !',
    formations: [
      { title: 'Préparation aux entretiens', description: 'Simulation d\'entretiens, techniques de présentation et négociation salariale' },
      { title: 'Optimisation CV & LinkedIn', description: 'Création de CV impactants et profils LinkedIn optimisés pour la finance' },
      { title: 'Coaching carrière personnalisé', description: 'Accompagnement sur-mesure pour définir et atteindre vos objectifs professionnels' },
    ],
  },
  about: {
    visible: true,
    title: 'Qui sommes-nous ?',
    description: 'Berthois Conseils propose des solutions de conseil en ressources humaines pour les profils en finance d\'entreprise et de marché. Nous avons à cœur de mettre l\'expérience candidat au centre de notre démarche tout en nous engageant dans la création de valeur pour nos clients.',
    vision: 'Le capital humain est la pierre angulaire d\'une entreprise. Nous nous engageons à lui accorder toute la place qu\'il mérite en mobilisant notre expertise au service de votre projet.',
    cards: [
      { title: 'Notre mission', description: 'Créer un acteur de référence dans la gestion des ressources humaines en finance, géré par des financiers pour des financiers.', icon: 'Target' },
      { title: 'Notre approche', description: 'Le capital humain est la pierre angulaire d\'une entreprise. Nous nous engageons à lui accorder toute la place qu\'il mérite.', icon: 'Users' },
      { title: 'Notre engagement', description: 'Mobiliser notre expertise au service de votre projet pour construire un monde professionnel adapté aux besoins de chacun.', icon: 'Award' },
    ],
  },
};

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Récupérer la configuration de la page d'accueil
 */
export async function getHomepageConfig(): Promise<HomepageConfig> {
  try {
    const { data, error } = await supabase
      .from('homepage_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No homepage config found, using defaults');
      return DEFAULT_HOMEPAGE_CONFIG;
    }

    return {
      id: data.id,
      hero: data.hero || DEFAULT_HOMEPAGE_CONFIG.hero,
      stats: data.stats || DEFAULT_HOMEPAGE_CONFIG.stats,
      offers: data.offers || DEFAULT_HOMEPAGE_CONFIG.offers,
      alternance: data.alternance || DEFAULT_HOMEPAGE_CONFIG.alternance,
      services: data.services || DEFAULT_HOMEPAGE_CONFIG.services,
      formations: data.formations || DEFAULT_HOMEPAGE_CONFIG.formations,
      about: data.about || DEFAULT_HOMEPAGE_CONFIG.about,
      updated_at: data.updated_at,
      updated_by: data.updated_by,
    };
  } catch (error) {
    console.error('Error loading homepage config:', error);
    return DEFAULT_HOMEPAGE_CONFIG;
  }
}

/**
 * Sauvegarder la configuration de la page d'accueil
 */
export async function saveHomepageConfig(
  config: HomepageConfig,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('homepage_config')
      .select('id')
      .limit(1)
      .single();

    const configData = {
      hero: config.hero,
      stats: config.stats,
      offers: config.offers,
      alternance: config.alternance,
      services: config.services,
      formations: config.formations,
      about: config.about,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    if (existing?.id) {
      // Update existing
      const { error } = await supabase
        .from('homepage_config')
        .update(configData)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('homepage_config')
        .insert(configData);

      if (error) throw error;
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Error saving homepage config:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Réinitialiser la configuration par défaut
 */
export async function resetHomepageConfig(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return saveHomepageConfig(DEFAULT_HOMEPAGE_CONFIG, userId);
}
