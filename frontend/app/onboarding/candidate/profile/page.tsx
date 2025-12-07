'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, MapPin, GraduationCap, Check, ArrowRight, ArrowLeft } from 'lucide-react';

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
}

const STUDY_LEVELS = [
  { value: 'L3', label: 'Licence 3 (Bac+3)' },
  { value: 'M1', label: 'Master 1 (Bac+4)' },
  { value: 'M2', label: 'Master 2 (Bac+5)' },
  { value: 'MBA', label: 'MBA' },
  { value: 'Autre', label: 'Autre' },
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
  });

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
  };

  const handleNext = () => {
    // Validation simple
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }
    } else if (step === 2) {
      if (!formData.city || !formData.postalCode) {
        alert('Veuillez remplir tous les champs obligatoires');
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
          target_locations: [formData.city],
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
            <span>Étape {step} sur 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
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

        {/* Step 2: Adresse */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Où habitez-vous ?
              </h1>
              <p className="text-gray-600">
                Nous utiliserons cette information pour trouver des offres près de chez vous
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="123 Rue de la Paix"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Paris"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="75001"
                    required
                  />
                </div>
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
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Études */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Votre parcours académique
              </h1>
              <p className="text-gray-600">
                Dernière étape avant de découvrir nos offres !
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
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
