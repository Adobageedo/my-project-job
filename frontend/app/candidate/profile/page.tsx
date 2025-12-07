'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { getCurrentCandidate, updateCandidateProfile, Candidate, getSavedCVs, getDefaultCV, SavedCV } from '@/services/candidateService';
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
} from 'lucide-react';

// Use the Candidate type from service

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
    searchType: 'stage',
  });

  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
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
          studyLevel: candidateData.education_level || 'M1',
          specialization: candidateData.specialization || '',
          alternanceRhythm: candidateData.alternance_rhythm || '',
          availableFrom: candidateData.available_from || '',
          linkedinUrl: candidateData.linkedin_url || '',
          portfolioUrl: candidateData.portfolio_url || '',
          bio: candidateData.bio || '',
          searchType: 'stage',
        });
        setLocations(candidateData.target_locations || []);
        setSkills(candidateData.skills || []);

        // Load CVs from candidate_cvs table
        const cvs = await getSavedCVs(candidateData.id);
        setCvCount(cvs.length);
        
        // Get default CV
        const defaultCv = await getDefaultCV(candidateData.id);
        setDefaultCV(defaultCv);
      } catch (err: any) {
        console.error('Erreur chargement profil:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

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
        target_locations: locations,
        linkedin_url: formData.linkedinUrl || undefined,
        portfolio_url: formData.portfolioUrl || undefined,
        bio: formData.bio || undefined,
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

  const handleAddLocation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      if (!locations.includes(locationInput.trim())) {
        setLocations([...locations, locationInput.trim()]);
      }
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations(locations.filter(l => l !== loc));
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
      studyLevel: candidate.education_level || 'M1',
      specialization: candidate.specialization || '',
      alternanceRhythm: candidate.alternance_rhythm || '',
      availableFrom: candidate.available_from || '',
      linkedinUrl: candidate.linkedin_url || '',
      portfolioUrl: candidate.portfolio_url || '',
      bio: candidate.bio || '',
      searchType: 'stage',
    });
    setLocations(candidate.target_locations || []);
    setSkills(candidate.skills || []);
    setIsEditing(false);
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
                <div className="flex items-center gap-4 mt-2">
                  {formData.searchType && (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      formData.searchType === 'stage' ? 'bg-blue-100 text-blue-700' :
                      formData.searchType === 'alternance' ? 'bg-purple-100 text-purple-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      <Briefcase className="h-3.5 w-3.5" />
                      {formData.searchType === 'stage' ? 'Recherche Stage' :
                       formData.searchType === 'alternance' ? 'Recherche Alternance' :
                       'Stage & Alternance'}
                    </span>
                  )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de recherche</label>
                      <select
                        name="searchType"
                        value={formData.searchType}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2.5 border rounded-lg transition ${
                          isEditing
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <option value="stage">Stage</option>
                        <option value="alternance">Alternance</option>
                        <option value="both">Stage et Alternance</option>
                      </select>
                    </div>
                    
                    {(formData.searchType === 'alternance' || formData.searchType === 'both') && (
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
                  </div>

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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />
                      Localisations souhaitées
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          onKeyDown={handleAddLocation}
                          placeholder="Tapez une ville et appuyez sur Entrée"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {locations.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {locations.map((loc, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                              >
                                <MapPin className="h-3 w-3" />
                                {loc}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLocation(loc)}
                                  className="hover:bg-blue-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {locations.map((loc, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            <MapPin className="h-3 w-3" />
                            {loc}
                          </span>
                        ))}
                        {locations.length === 0 && (
                          <span className="text-gray-500 text-sm">Aucune localisation définie</span>
                        )}
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
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Présentez-vous en quelques mots : vos motivations, vos objectifs professionnels..."
                    className={`w-full px-4 py-2.5 border rounded-lg transition ${
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
                      <input
                        name="linkedinUrl"
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
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
                      <input
                        name="portfolioUrl"
                        type="url"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
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
