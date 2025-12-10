'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, MapPin, GraduationCap, Check, ArrowRight, ArrowLeft, Briefcase, Link2, AlertCircle, Linkedin, Globe, X } from 'lucide-react';
import { MultiLocationAutocomplete } from '@/components/shared/LocationAutocomplete';
import { LocationHierarchy } from '@/data/locations';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
  school: string;
  studyLevel: string;
  specialization: string;
  availableFrom: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

const STUDY_LEVELS = [
  { value: 'bac+3', label: 'Licence 3 (Bac+3)' },
  { value: 'bac+4', label: 'Master 1 (Bac+4)' },
  { value: 'bac+5', label: 'Master 2 (Bac+5)' },
  { value: 'bac+6', label: 'MBA / Bac+6' },
  { value: 'doctorat', label: 'Doctorat' },
];


export default function CandidateOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    postalCode: '',
    school: '',
    studyLevel: 'bac+4',
    specialization: '',
    availableFrom: '',
    linkedinUrl: '',
    portfolioUrl: '',
  });

  // Types de contrat recherchés
  const [contractTypes, setContractTypes] = useState<string[]>(['stage']);
  
  // Localisations souhaitées (format hiérarchique)
  const [targetLocations, setTargetLocations] = useState<LocationHierarchy[]>([]);
  
  // Erreurs de validation
  const [linkErrors, setLinkErrors] = useState<{ linkedin?: string; portfolio?: string }>({});

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Vérifier si le profil est déjà complet (first_name is set)
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, first_name')
        .eq('id', user.id)
        .eq('role', 'candidate')
        .single();

      if (existingProfile?.first_name) {
        // Profil déjà créé, rediriger vers le dashboard
        router.push('/candidate/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear link errors when user types
    if (field === 'linkedinUrl') setLinkErrors(prev => ({ ...prev, linkedin: undefined }));
    if (field === 'portfolioUrl') setLinkErrors(prev => ({ ...prev, portfolio: undefined }));
  };

  // Normalisation des URLs (ajoute https:// si manquant)
  const normalizeUrl = (url: string): string => {
    if (!url || url.trim() === '') return '';
    
    let normalized = url.trim();
    
    // Ajouter https:// si le protocole est manquant
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    return normalized;
  };

  // Validation des URLs
  const validateUrl = (url: string, type: 'linkedin' | 'portfolio'): string | null => {
    if (!url || url.trim() === '') return null; // Vide = OK
    
    const normalized = normalizeUrl(url);
    
    try {
      const parsed = new URL(normalized);
      
      if (type === 'linkedin') {
        if (!parsed.hostname.includes('linkedin.com')) {
          return 'Le lien doit être un profil LinkedIn (linkedin.com)';
        }
        if (!normalized.includes('/in/') && !normalized.includes('/company/')) {
          return 'Format: linkedin.com/in/votre-profil';
        }
      }
      
      if (type === 'portfolio') {
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return 'Le lien doit commencer par http:// ou https://';
        }
      }
      
      return null;
    } catch {
      return 'URL invalide';
    }
  };

  // Toggle contract type
  const toggleContractType = (type: string) => {
    if (contractTypes.includes(type)) {
      // Don't allow removing the last one
      if (contractTypes.length > 1) {
        setContractTypes(contractTypes.filter(t => t !== type));
      }
    } else {
      setContractTypes([...contractTypes, type]);
    }
  };

  const handleNext = () => {
    // Validation par étape
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
    } else if (step === 2) {
      if (targetLocations.length === 0) {
        alert('Veuillez sélectionner au moins une localisation');
        return;
      }
    } else if (step === 3) {
      // Valider les liens si renseignés
      const linkedinError = validateUrl(formData.linkedinUrl, 'linkedin');
      const portfolioError = validateUrl(formData.portfolioUrl, 'portfolio');
      
      if (linkedinError || portfolioError) {
        setLinkErrors({ linkedin: linkedinError || undefined, portfolio: portfolioError || undefined });
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    // Validation finale
    if (!formData.school || !formData.studyLevel) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update the user profile in the unified users table
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          institution: formData.school,
          education_level: formData.studyLevel,
          specialization: formData.specialization,
          available_from: formData.availableFrom || null,
          // Convertir LocationHierarchy[] en string[] pour la sauvegarde
          target_locations: targetLocations.map(loc => loc.city || loc.region || loc.country || '').filter(Boolean),
          contract_types_sought: contractTypes,
          // Normaliser les URLs avant de les envoyer
          linkedin_url: formData.linkedinUrl?.trim() ? normalizeUrl(formData.linkedinUrl) : null,
          portfolio_url: formData.portfolioUrl?.trim() ? normalizeUrl(formData.portfolioUrl) : null,
          onboarding_completed: true,
          profile_completed: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Succès ! Redirection vers le dashboard
      router.push('/candidate/dashboard?onboarding=complete');
    } catch (err: any) {
      console.error('Erreur création profil:', err);
      alert(err.message || 'Erreur lors de la création du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 font-medium">
            <span>Étape {step} sur 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Informations personnelles */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Informations personnelles
              </h1>
              <p className="text-gray-600">
                Parlez-nous un peu de vous
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jean"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange('birthDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              Continuer
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Localisations souhaitées */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Où souhaitez-vous travailler ?
              </h1>
              <p className="text-gray-600">
                Sélectionnez les villes où vous recherchez un stage ou une alternance
              </p>
            </div>

            <MultiLocationAutocomplete
              values={targetLocations}
              onChange={setTargetLocations}
              placeholder="Rechercher une ville, région..."
              maxLocations={10}
              allowedTypes={['city', 'region', 'country']}
            />

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleNext}
                disabled={targetLocations.length === 0}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Études & Type de recherche */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Votre parcours & recherche
              </h1>
              <p className="text-gray-600">
                Parlez-nous de vos études et de ce que vous recherchez
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  École / Université *
                </label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => handleChange('school', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="HEC Paris"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau d'études *
                  </label>
                  <select
                    value={formData.studyLevel}
                    onChange={(e) => handleChange('studyLevel', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {STUDY_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialisation
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Finance d'entreprise"
                  />
                </div>
              </div>

              {/* Type de contrat recherché */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de contrat recherché *
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleContractType('stage')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      contractTypes.includes('stage')
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                    Stage
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleContractType('alternance')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                      contractTypes.includes('alternance')
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                    Alternance
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Vous pouvez sélectionner les deux</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disponible à partir du
                </label>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => handleChange('availableFrom', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Liens & Finalisation */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Link2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Vos liens professionnels
              </h1>
              <p className="text-gray-600">
                Dernière étape ! Ajoutez vos liens pour compléter votre profil
              </p>
            </div>

            <div className="space-y-4">
              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Linkedin className="inline w-4 h-4 mr-1 text-[#0A66C2]" />
                  Profil LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    linkErrors.linkedin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://linkedin.com/in/votre-profil"
                />
                {linkErrors.linkedin && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {linkErrors.linkedin}
                  </p>
                )}
              </div>

              {/* Portfolio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="inline w-4 h-4 mr-1 text-gray-500" />
                  Portfolio / Site web
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    linkErrors.portfolio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://mon-portfolio.com"
                />
                {linkErrors.portfolio && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {linkErrors.portfolio}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                💡 Ces liens sont optionnels mais aident les recruteurs à mieux vous connaître.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Création...'
                ) : (
                  <>
                    Terminer
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Skip option */}
        <div className="text-center">
          <button
            onClick={() => router.push('/candidate/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Je compléterai mon profil plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
