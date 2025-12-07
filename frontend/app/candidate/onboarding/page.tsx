'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import CVUpload from '@/components/cv/CVUpload';
import { 
  User, Phone, GraduationCap, MapPin, Calendar, 
  ChevronRight, ChevronLeft, Upload, X, Globe, Linkedin, Briefcase, CheckCircle,
  FileText, Sparkles, AlertCircle, Loader2, Check
} from 'lucide-react';
import { CVParseResult } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboarding, uploadCV } from '@/services/candidateService';

export default function CandidateOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedCV, setUploadedCV] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    school: '',
    studyLevel: 'bac+4',
    specialization: '',
    locations: [] as string[],
    locationInput: '',
    availableFrom: '',
    alternanceRhythm: '',
    contractType: 'stage',
    searchType: 'stage' as 'stage' | 'alternance' | 'both',
    linkedinUrl: '',
    portfolioUrl: '',
    bio: '',
    skills: [] as string[],
    skillInput: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [isParsed, setIsParsed] = useState(false);
  const [parsedFields, setParsedFields] = useState<string[]>([]);

  const handleCVParse = (parsedData: CVParseResult) => {
    const fieldsUpdated: string[] = [];
    
    setFormData(prev => {
      const updated = { ...prev };
      
      if (parsedData.firstName) { updated.firstName = parsedData.firstName; fieldsUpdated.push('firstName'); }
      if (parsedData.lastName) { updated.lastName = parsedData.lastName; fieldsUpdated.push('lastName'); }
      if (parsedData.phone) { updated.phone = parsedData.phone; fieldsUpdated.push('phone'); }
      if (parsedData.school) { updated.school = parsedData.school; fieldsUpdated.push('school'); }
      if (parsedData.studyLevel) { updated.studyLevel = parsedData.studyLevel; fieldsUpdated.push('studyLevel'); }
      if (parsedData.specialization) { updated.specialization = parsedData.specialization; fieldsUpdated.push('specialization'); }
      if (parsedData.locations && parsedData.locations.length > 0) { updated.locations = parsedData.locations; fieldsUpdated.push('locations'); }
      if (parsedData.skills && parsedData.skills.length > 0) { updated.skills = parsedData.skills; fieldsUpdated.push('skills'); }
      if (parsedData.linkedinUrl) { updated.linkedinUrl = parsedData.linkedinUrl; fieldsUpdated.push('linkedinUrl'); }
      if (parsedData.portfolioUrl) { updated.portfolioUrl = parsedData.portfolioUrl; fieldsUpdated.push('portfolioUrl'); }
      if (parsedData.bio) { updated.bio = parsedData.bio; fieldsUpdated.push('bio'); }
      if (parsedData.contractType) { 
        // Map contractType to searchType
        updated.searchType = parsedData.contractType === 'apprentissage' ? 'alternance' : parsedData.contractType;
        fieldsUpdated.push('searchType'); 
      }
      if (parsedData.availableFrom) { updated.availableFrom = parsedData.availableFrom; fieldsUpdated.push('availableFrom'); }
      
      return updated;
    });
    
    setParsedFields(fieldsUpdated);
    setIsParsed(true);
    
    // Go to step 2 after successful parsing
    setCurrentStep(2);
  };

  // Helper pour afficher un indicateur si le champ a été pré-rempli
  const ParsedIndicator = ({ field }: { field: string }) => {
    if (!parsedFields.includes(field)) return null;
    return (
      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
        <Sparkles className="h-3 w-3" />
        Auto
      </span>
    );
  };

  const handleAddLocation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.locationInput.trim()) {
      e.preventDefault();
      if (!formData.locations.includes(formData.locationInput.trim())) {
        setFormData({
          ...formData,
          locations: [...formData.locations, formData.locationInput.trim()],
          locationInput: '',
        });
      }
    }
  };

  const handleRemoveLocation = (location: string) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter(loc => loc !== location),
    });
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(formData.skillInput.trim())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, formData.skillInput.trim()],
          skillInput: '',
        });
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill),
    });
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipCV = () => {
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        router.push('/login');
        return;
      }

      // Upload CV to candidate_cvs table if present
      if (uploadedCV) {
        const cvResult = await uploadCV(
          user.id, 
          uploadedCV, 
          uploadedCV.name.replace(/\.[^/.]+$/, ''), // CV name without extension
          true // Set as default
        );
        
        if (!cvResult.success) {
          console.error('Erreur upload CV:', cvResult.error);
        }
      }

      // Use service function to complete onboarding (without cvUrl since it's now in candidate_cvs)
      const result = await completeOnboarding(user.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        school: formData.school,
        studyLevel: formData.studyLevel,
        specialization: formData.specialization,
        alternanceRhythm: formData.alternanceRhythm,
        availableFrom: formData.availableFrom,
        locations: formData.locations,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        bio: formData.bio,
        skills: formData.skills,
      });

      if (!result.success) {
        console.error('Erreur onboarding:', result.error);
        throw new Error(result.error);
      }

      // Redirection vers le dashboard avec paramètre onboarding=complete
      router.push('/candidate/dashboard?onboarding=complete');
    } catch (error) {
      console.error('Erreur onboarding:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Étape {currentStep} sur 3
              </span>
              <span className="text-sm text-gray-600">
                {currentStep === 1 ? 'Upload CV' : currentStep === 2 ? 'Type de recherche' : 'Informations du profil'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Step 1: CV Upload */}
            {currentStep === 1 && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Importez votre CV
                  </h1>
                  <p className="text-gray-600">
                    Notre IA analysera votre CV pour pré-remplir votre profil automatiquement
                  </p>
                </div>

                {/* Avantages du parsing */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <Sparkles className="h-6 w-6 text-blue-600 mb-2" />
                    <h3 className="font-medium text-gray-900 text-sm">Extraction IA</h3>
                    <p className="text-xs text-gray-600 mt-1">Nom, prénom, téléphone, formation extraits automatiquement</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                    <h3 className="font-medium text-gray-900 text-sm">Vérification</h3>
                    <p className="text-xs text-gray-600 mt-1">Vous pourrez vérifier et modifier toutes les informations</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                    <Briefcase className="h-6 w-6 text-purple-600 mb-2" />
                    <h3 className="font-medium text-gray-900 text-sm">Compétences</h3>
                    <p className="text-xs text-gray-600 mt-1">Vos compétences et expériences détectées</p>
                  </div>
                </div>

                <CVUpload
                  onParseComplete={handleCVParse}
                  onFileUpload={(file: File) => setUploadedCV(file)}
                />

                {/* Indicateur de succès du parsing */}
                {isParsed && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">CV analysé avec succès !</p>
                        <p className="text-sm text-green-700">
                          {parsedFields.length} champ{parsedFields.length > 1 ? 's' : ''} pré-rempli{parsedFields.length > 1 ? 's' : ''} automatiquement
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={handleSkipCV}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Remplir manuellement
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!uploadedCV && !isParsed}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isParsed ? 'Vérifier les informations' : 'Continuer'}
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Search Type */}
            {currentStep === 2 && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Que recherchez-vous ?
                  </h1>
                  <p className="text-gray-600">
                    Sélectionnez le type d'opportunité qui vous intéresse
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, searchType: 'stage' })}
                    className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                      formData.searchType === 'stage'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Stage
                        </h3>
                        <p className="text-sm text-gray-600">
                          Stage de fin d'études, stage de césure ou stage de découverte
                        </p>
                      </div>
                      {formData.searchType === 'stage' && (
                        <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, searchType: 'alternance' })}
                    className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                      formData.searchType === 'alternance'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Alternance
                        </h3>
                        <p className="text-sm text-gray-600">
                          Contrat d'apprentissage ou de professionnalisation
                        </p>
                      </div>
                      {formData.searchType === 'alternance' && (
                        <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, searchType: 'both' })}
                    className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                      formData.searchType === 'both'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Les deux
                        </h3>
                        <p className="text-sm text-gray-600">
                          Je suis ouvert aux stages et aux alternances
                        </p>
                      </div>
                      {formData.searchType === 'both' && (
                        <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                </div>

                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-semibold"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    Continuer
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Profile Information */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit}>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Complétez votre profil
                  </h1>
                  <p className="text-gray-600">
                    Ces informations nous aideront à vous proposer les meilleures opportunités
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Indicateur de pré-remplissage */}
                  {isParsed && parsedFields.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl mb-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">Informations pré-remplies depuis votre CV</p>
                          <p className="text-sm text-green-700 mt-1">
                            Les champs marqués <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded"><Sparkles className="h-3 w-3" />Auto</span> ont été extraits automatiquement. Vérifiez et modifiez si nécessaire.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nom et Prénom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                        <ParsedIndicator field="firstName" />
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('firstName') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                          placeholder="Jean"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                        <ParsedIndicator field="lastName" />
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('lastName') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                          placeholder="Dupont"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                      <ParsedIndicator field="phone" />
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('phone') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                        placeholder="+33 6 12 34 56 78"
                        required
                      />
                    </div>
                  </div>

                  {/* École et Niveau */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                        École / Université *
                        <ParsedIndicator field="school" />
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="school"
                          name="school"
                          type="text"
                          value={formData.school}
                          onChange={handleChange}
                          className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('school') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                          placeholder="HEC Paris"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="studyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        Niveau d'études *
                        <ParsedIndicator field="studyLevel" />
                      </label>
                      <select
                        id="studyLevel"
                        name="studyLevel"
                        value={formData.studyLevel}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('studyLevel') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                        required
                      >
                        <option value="bac">Bac</option>
                        <option value="bac+1">Bac+1</option>
                        <option value="bac+2">Bac+2 (BTS, DUT)</option>
                        <option value="bac+3">Bac+3 (Licence)</option>
                        <option value="bac+4">Bac+4 (Master 1)</option>
                        <option value="bac+5">Bac+5 (Master 2, Ingénieur)</option>
                        <option value="bac+6">Bac+6</option>
                        <option value="doctorat">Doctorat</option>
                      </select>
                    </div>
                  </div>

                  {/* Spécialisation */}
                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                      Spécialisation *
                      <ParsedIndicator field="specialization" />
                    </label>
                    <input
                      id="specialization"
                      name="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('specialization') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                      placeholder="Finance de marché"
                      required
                    />
                  </div>

                  {/* Localisations */}
                  <div>
                    <label htmlFor="locationInput" className="block text-sm font-medium text-gray-700 mb-2">
                      Localisations souhaitées * (appuyez sur Entrée pour ajouter)
                      <ParsedIndicator field="locations" />
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="locationInput"
                        name="locationInput"
                        type="text"
                        value={formData.locationInput}
                        onChange={handleChange}
                        onKeyDown={handleAddLocation}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Paris, Lyon, Marseille..."
                      />
                    </div>
                    {formData.locations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.locations.map((location) => (
                          <span
                            key={location}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${parsedFields.includes('locations') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                          >
                            <MapPin className="h-3 w-3" />
                            {location}
                            <button
                              type="button"
                              onClick={() => handleRemoveLocation(location)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Type de contrat */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 mb-2">
                        Type de contrat recherché *
                      </label>
                      <select
                        id="contractType"
                        name="contractType"
                        value={formData.contractType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="stage">Stage</option>
                        <option value="alternance">Alternance</option>
                        <option value="apprentissage">Apprentissage</option>
                      </select>
                    </div>

                    {(formData.contractType === 'alternance' || formData.contractType === 'apprentissage') && (
                      <div>
                        <label htmlFor="alternanceRhythm" className="block text-sm font-medium text-gray-700 mb-2">
                          Rythme d'alternance
                        </label>
                        <input
                          id="alternanceRhythm"
                          name="alternanceRhythm"
                          type="text"
                          value={formData.alternanceRhythm}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="3 jours / 2 jours"
                        />
                      </div>
                    )}
                  </div>

                  {/* Date de disponibilité */}
                  <div>
                    <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-2">
                      Disponible à partir de *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="availableFrom"
                        name="availableFrom"
                        type="date"
                        value={formData.availableFrom}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Compétences */}
                  <div>
                    <label htmlFor="skillInput" className="block text-sm font-medium text-gray-700 mb-2">
                      Compétences (appuyez sur Entrée pour ajouter)
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="skillInput"
                        name="skillInput"
                        type="text"
                        value={formData.skillInput}
                        onChange={handleChange}
                        onKeyDown={handleAddSkill}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Excel, Python, Gestion de projet..."
                      />
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="hover:bg-purple-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* LinkedIn & Portfolio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn (optionnel)
                        <ParsedIndicator field="linkedinUrl" />
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="linkedinUrl"
                          name="linkedinUrl"
                          type="url"
                          value={formData.linkedinUrl}
                          onChange={handleChange}
                          className={`pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('linkedinUrl') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio / Site web (optionnel)
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="portfolioUrl"
                          name="portfolioUrl"
                          type="url"
                          value={formData.portfolioUrl}
                          onChange={handleChange}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Présentation / Bio
                      <ParsedIndicator field="bio" />
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${parsedFields.includes('bio') ? 'border-green-300 bg-green-50/50' : 'border-gray-300'}`}
                      placeholder="Présentez-vous en quelques mots : vos motivations, vos objectifs professionnels..."
                    />
                    <p className="mt-1 text-xs text-gray-500">Cette description sera visible par les recruteurs</p>
                  </div>
                </div>

                {/* Boutons */}
                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-semibold"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Enregistrement...' : 'Terminer mon inscription'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
