'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { getCurrentCandidate, updateCandidateProfile, Candidate, getSavedCVs, getDefaultCV, SavedCV } from '@/services/candidateService';
import { getNotificationSettings, updateNotificationSettings } from '@/services/notificationsService';
import type { NotificationSettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  FileText, 
  Upload,
  Calendar,
  ChevronRight,
  Star,
  CheckCircle,
  Loader2,
  AlertCircle,
  Globe,
  Linkedin,
  X,
  Edit3,
  Save,
  ExternalLink,
  Shield,
  Clock,
  Bell,
} from 'lucide-react';
import { MultiLocationAutocomplete } from '@/components/shared/LocationAutocomplete';
import { LocationHierarchy, getCityHierarchy } from '@/data/locations';

export default function CandidateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cvCount, setCvCount] = useState<number>(0);
  const [defaultCV, setDefaultCV] = useState<SavedCV | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    school: '',
    studyLevel: 'bac+4',
    specialization: '',
    alternanceRhythm: '',
    availableFrom: '',
    linkedinUrl: '',
    portfolioUrl: '',
    bio: '',
  });

  // Types de contrat recherchés (stage, alternance, ou les deux)
  const [contractTypes, setContractTypes] = useState<string[]>(['stage']);
  
  // Erreurs de validation des liens
  const [linkErrors, setLinkErrors] = useState<{ linkedin?: string; portfolio?: string }>({});

  // Localisations avec le format hiérarchique
  const [locations, setLocations] = useState<LocationHierarchy[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Charger le profil candidat via service
  useEffect(() => {
    async function loadProfile() {
      try {
        const candidateData = await getCurrentCandidate();
        
        if (!candidateData) {
          // Pas de profil candidat, rediriger vers onboarding
          router.push('/candidate/onboarding');
          return;
        }

        setCandidate(candidateData);
        setFormData({
          firstName: candidateData.first_name || '',
          lastName: candidateData.last_name || '',
          email: candidateData.email || '',
          phone: candidateData.phone || '',
          school: candidateData.institution || '',
          // Supabase enum values: 'bac','bac+1',...,'bac+6','doctorat'
          studyLevel: candidateData.education_level || 'bac+4',
          specialization: candidateData.specialization || '',
          alternanceRhythm: candidateData.alternance_rhythm || '',
          availableFrom: candidateData.available_from || '',
          linkedinUrl: candidateData.linkedin_url || '',
          portfolioUrl: candidateData.portfolio_url || '',
          bio: candidateData.bio || '',
        });
        // Charger les types de contrat recherchés
        setContractTypes(candidateData.contract_types_sought?.length > 0 
          ? candidateData.contract_types_sought 
          : ['stage']);
        // Convertir les strings en LocationHierarchy
        const locationHierarchies = (candidateData.target_locations || []).map((loc: string) => {
          // Essayer de parser comme ville française, sinon créer une hiérarchie simple
          const hierarchy = getCityHierarchy(loc, 'FR');
          return hierarchy || { city: loc, country: 'France' };
        });
        setLocations(locationHierarchies);
        setSkills(candidateData.skills || []);

        // Load CVs from candidate_cvs table
        const cvs = await getSavedCVs(candidateData.id);
        setCvCount(cvs.length);
        
        // Get default CV
        const defaultCv = await getDefaultCV(candidateData.id);
        setDefaultCV(defaultCv);

        // Load notification settings
        try {
          const notifSettings = await getNotificationSettings(candidateData.id);
          setNotificationSettings(notifSettings);
        } catch (notifErr) {
          console.error('Erreur chargement notifications:', notifErr);
          // Valeurs par défaut si erreur
          setNotificationSettings({
            userId: candidateData.id,
            emailMatchingOffers: true,
            emailApplicationUpdates: true,
          });
        }
      } catch (err: any) {
        console.error('Erreur chargement profil:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Normalisation des URLs (ajoute https:// si manquant)
  const normalizeUrl = (url: string, type: 'linkedin' | 'portfolio'): string => {
    if (!url || url.trim() === '') return '';
    
    let normalized = url.trim();
    
    // Ajouter https:// si le protocole est manquant
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    return normalized;
  };

  // Validation des liens
  const validateUrl = (url: string, type: 'linkedin' | 'portfolio'): string | null => {
    if (!url || url.trim() === '') return null; // Vide = OK (suppression)
    
    const normalized = normalizeUrl(url, type);
    
    try {
      const parsed = new URL(normalized);
      
      if (type === 'linkedin') {
        if (!parsed.hostname.includes('linkedin.com')) {
          return 'Le lien doit être un profil LinkedIn (linkedin.com)';
        }
        if (!normalized.includes('/in/') && !normalized.includes('/company/')) {
          return 'Format LinkedIn invalide. Utilisez: linkedin.com/in/votre-profil';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    // Valider les liens
    const linkedinError = validateUrl(formData.linkedinUrl, 'linkedin');
    const portfolioError = validateUrl(formData.portfolioUrl, 'portfolio');
    
    if (linkedinError || portfolioError) {
      setLinkErrors({ linkedin: linkedinError || undefined, portfolio: portfolioError || undefined });
      return;
    }
    setLinkErrors({});

    setSaving(true);
    setError(null);

    try {
      const result = await updateCandidateProfile(candidate.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        institution: formData.school,
        education_level: formData.studyLevel,
        specialization: formData.specialization,
        alternance_rhythm: formData.alternanceRhythm || undefined,
        available_from: formData.availableFrom || undefined,
        contract_types_sought: contractTypes,
        // Convertir LocationHierarchy[] en string[] pour la sauvegarde
        target_locations: locations.map(loc => loc.city || loc.region || loc.country || '').filter(Boolean),
        // Normaliser les URLs ou envoyer null pour suppression
        linkedin_url: formData.linkedinUrl?.trim() ? normalizeUrl(formData.linkedinUrl, 'linkedin') : null,
        portfolio_url: formData.portfolioUrl?.trim() ? normalizeUrl(formData.portfolioUrl, 'portfolio') : null,
        bio: formData.bio?.trim() || null,
        skills: skills.length > 0 ? skills : undefined,
      });

      if (!result.success) throw new Error(result.error);

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur mise à jour:', err);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleCancel = () => {
    if (!candidate) return;
    setFormData({
      firstName: candidate.first_name || '',
      lastName: candidate.last_name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      school: candidate.institution || '',
      studyLevel: candidate.education_level || 'bac+4',
      specialization: candidate.specialization || '',
      alternanceRhythm: candidate.alternance_rhythm || '',
      availableFrom: candidate.available_from || '',
      linkedinUrl: candidate.linkedin_url || '',
      portfolioUrl: candidate.portfolio_url || '',
      bio: candidate.bio || '',
    });
    setContractTypes(candidate.contract_types_sought?.length > 0 
      ? candidate.contract_types_sought 
      : ['stage']);
    // Convertir les strings en LocationHierarchy
    const locationHierarchies = (candidate.target_locations || []).map((loc: string) => {
      const hierarchy = getCityHierarchy(loc, 'FR');
      return hierarchy || { city: loc, country: 'France' };
    });
    setLocations(locationHierarchies);
    setSkills(candidate.skills || []);
    setLinkErrors({});
    setIsEditing(false);
  };

  const handleToggleNotification = async (field: 'emailMatchingOffers' | 'emailApplicationUpdates') => {
    if (!candidate || !notificationSettings) return;
    
    setSavingNotifications(true);
    try {
      const newValue = !notificationSettings[field];
      const updated = await updateNotificationSettings(candidate.id, {
        [field]: newValue,
      });
      setNotificationSettings(updated);
    } catch (err) {
      console.error('Erreur mise à jour notifications:', err);
    } finally {
      setSavingNotifications(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="candidate" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Profil non trouvé</p>
            <Link href="/candidate/onboarding" className="text-blue-600 hover:underline mt-2 inline-block">
              Compléter mon profil
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header avec avatar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">
                  {formData.firstName} {formData.lastName}
                </h1>
                <p className="text-gray-600">{formData.email}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {contractTypes.map((type) => (
                    <span key={type} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      type === 'stage' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Briefcase className="h-3.5 w-3.5" />
                      {type === 'stage' ? 'Stage' : 'Alternance'}
                    </span>
                  ))}
                  {formData.availableFrom && (
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3.5 w-3.5" />
                      Disponible dès {new Date(formData.availableFrom).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>Profil mis à jour avec succès !</span>
            </div>
          )}

          {/* Grille de sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section Identité & Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informations personnelles
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                      <input
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                      <input
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Mail className="inline h-4 w-4 mr-1 text-gray-400" />
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Phone className="inline h-4 w-4 mr-1 text-gray-400" />
                        Téléphone
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Section Formation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                  Formation
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">École / Université</label>
                      <input
                        name="school"
                        type="text"
                        value={formData.school}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Niveau d'études</label>
                      <select
                        name="studyLevel"
                        value={formData.studyLevel}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Spécialisation</label>
                    <input
                      name="specialization"
                      type="text"
                      value={formData.specialization}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg transition ${
                        isEditing
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section Recherche */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Recherche d'emploi
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de recherche</label>
                    <div className="flex flex-wrap gap-3">
                      <label className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition ${
                        contractTypes.includes('stage')
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={contractTypes.includes('stage')}
                          onChange={(e) => {
                            if (!isEditing) return;
                            if (e.target.checked) {
                              setContractTypes([...contractTypes, 'stage']);
                            } else {
                              // Ne pas permettre de tout décocher
                              if (contractTypes.length > 1) {
                                setContractTypes(contractTypes.filter(t => t !== 'stage'));
                              }
                            }
                          }}
                          disabled={!isEditing}
                          className="sr-only"
                        />
                        <Briefcase className="h-4 w-4" />
                        Stage
                      </label>
                      <label className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition ${
                        contractTypes.includes('alternance')
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={contractTypes.includes('alternance')}
                          onChange={(e) => {
                            if (!isEditing) return;
                            if (e.target.checked) {
                              setContractTypes([...contractTypes, 'alternance']);
                            } else {
                              // Ne pas permettre de tout décocher
                              if (contractTypes.length > 1) {
                                setContractTypes(contractTypes.filter(t => t !== 'alternance'));
                              }
                            }
                          }}
                          disabled={!isEditing}
                          className="sr-only"
                        />
                        <GraduationCap className="h-4 w-4" />
                        Alternance
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Sélectionnez un ou plusieurs types</p>
                  </div>
                    
                  {contractTypes.includes('alternance') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Rythme d'alternance</label>
                      <input
                        name="alternanceRhythm"
                        type="text"
                        value={formData.alternanceRhythm}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Ex: 3 jours / 2 jours"
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />
                      Date de disponibilité
                    </label>
                    <input
                      name="availableFrom"
                      type="date"
                      value={formData.availableFrom}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-2.5 border rounded-lg transition ${
                        isEditing
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    />
                  </div>

                  {/* Localisations souhaitées */}
                  <div>
                    {isEditing ? (
                      <MultiLocationAutocomplete
                        values={locations}
                        onChange={setLocations}
                        label="Localisations souhaitées"
                        placeholder="Ajouter une localisation..."
                        maxLocations={10}
                        allowedTypes={['city', 'region', 'country']}
                      />
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />
                          Localisations souhaitées
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {locations.map((loc, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                            >
                              <MapPin className="h-3 w-3" />
                              {loc.city || loc.region || loc.country || 'Non spécifié'}
                            </span>
                          ))}
                          {locations.length === 0 && (
                            <span className="text-gray-500 text-sm">Aucune localisation définie</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Présentation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Présentation
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio / Description</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={(e) => {
                      handleChange(e);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onFocus={(e) => {
                      // Ajuster la taille au focus
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    disabled={!isEditing}
                    rows={2}
                    style={{ minHeight: '80px', maxHeight: '400px', overflow: 'auto' }}
                    placeholder="Présentez-vous en quelques mots : vos motivations, vos objectifs professionnels..."
                    className={`w-full px-4 py-2.5 border rounded-lg transition resize-none ${
                      isEditing
                        ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Cette description sera visible par les recruteurs</p>
                </div>
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Compétences */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Compétences
                </h2>
                
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Ajouter une compétence..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée pour ajouter</p>
                  </div>
                ) : null}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                        isEditing ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-gray-500 text-sm">Aucune compétence définie</span>
                  )}
                </div>
              </div>

              {/* Liens */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Liens
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Linkedin className="inline h-4 w-4 mr-1 text-[#0A66C2]" />
                      LinkedIn
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          name="linkedinUrl"
                          type="url"
                          value={formData.linkedinUrl}
                          onChange={handleChange}
                          placeholder="https://linkedin.com/in/votre-profil"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                            linkErrors.linkedin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {linkErrors.linkedin && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {linkErrors.linkedin}
                          </p>
                        )}
                      </div>
                    ) : formData.linkedinUrl ? (
                      <a
                        href={formData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Voir le profil
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">Non renseigné</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Globe className="inline h-4 w-4 mr-1 text-gray-400" />
                      Portfolio / Site web
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          name="portfolioUrl"
                          type="url"
                          value={formData.portfolioUrl}
                          onChange={handleChange}
                          placeholder="https://mon-portfolio.com"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                            linkErrors.portfolio ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {linkErrors.portfolio && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {linkErrors.portfolio}
                          </p>
                        )}
                      </div>
                    ) : formData.portfolioUrl ? (
                      <a
                        href={formData.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Voir le site
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CV Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    Mon CV
                  </h2>
                  <Link
                    href="/candidate/cv"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Gérer
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                
                {defaultCV ? (
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {defaultCV.name || 'CV principal'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Par défaut
                          </span>
                          {cvCount > 1 && (
                            <span className="text-xs text-gray-500">+{cvCount - 1} autre{cvCount > 2 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <a 
                      href={defaultCV.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir le CV
                    </a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm mb-2">Aucun CV</p>
                    <Link
                      href="/candidate/cv"
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Ajouter un CV
                    </Link>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Notifications
                </h2>
                
                <div className="space-y-4">
                  {/* Alertes offres correspondantes */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <div className="font-medium text-gray-900">Alertes offres correspondantes</div>
                      <div className="text-sm text-gray-600">
                        Recevez des emails pour les nouvelles offres qui correspondent à votre profil
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleNotification('emailMatchingOffers')}
                      disabled={savingNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition flex-shrink-0 ${
                        notificationSettings?.emailMatchingOffers ? 'bg-blue-600' : 'bg-gray-300'
                      } ${savingNotifications ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationSettings?.emailMatchingOffers ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Notifications candidatures */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <div className="font-medium text-gray-900">Mises à jour de candidatures</div>
                      <div className="text-sm text-gray-600">
                        Recevez des notifications quand le statut de vos candidatures change
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleNotification('emailApplicationUpdates')}
                      disabled={savingNotifications}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition flex-shrink-0 ${
                        notificationSettings?.emailApplicationUpdates ? 'bg-blue-600' : 'bg-gray-300'
                      } ${savingNotifications ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notificationSettings?.emailApplicationUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Lien vers recherches sauvegardées */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">
                      Pour configurer des alertes sur des critères de recherche spécifiques, gérez vos recherches sauvegardées.
                    </p>
                    <Link
                      href="/candidate/searches"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Gérer mes recherches sauvegardées
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* RGPD */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Données personnelles
                </h2>
                
                <p className="text-sm text-gray-600 mb-4">
                  Gérez vos données personnelles, exportez-les ou supprimez votre compte.
                </p>
                
                <Link
                  href="/candidate/gdpr"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                >
                  <Shield className="h-4 w-4" />
                  Paramètres RGPD
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
