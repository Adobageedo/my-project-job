'use client';

import { useState } from 'react';
import JobOfferPDFParser from './JobOfferPDFParser';
import { 
  FileText, 
  PenLine, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Save, 
  Loader2,
  Check,
  Upload,
} from 'lucide-react';

export interface OfferFormData {
  title: string;
  description: string;
  missions: string[];
  objectives: string;
  reporting: string;
  studyLevel: string[];
  skills: string[];
  contractType: 'stage' | 'alternance' | 'cdi' | 'cdd';
  duration: string;
  startDate: string;
  location: string;
  remotePolicy: string;
  salary: string;
  applicationProcess: string;
  requiresCoverLetter: boolean;
  managerEmail: string;
}

export const defaultFormData: OfferFormData = {
  title: '',
  description: '',
  missions: ['', '', ''],
  objectives: '',
  reporting: '',
  studyLevel: [],
  skills: [''],
  contractType: 'stage',
  duration: '',
  startDate: '',
  location: '',
  remotePolicy: 'on_site',
  salary: '',
  applicationProcess: 'CV + Lettre de motivation',
  requiresCoverLetter: true,
  managerEmail: '',
};

interface OfferFormProps {
  initialData?: Partial<OfferFormData>;
  onSubmit: (data: OfferFormData, status: 'draft' | 'active') => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  saving?: boolean;
}

type Step = 'choose' | 'form';

export default function OfferForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  saving = false 
}: OfferFormProps) {
  const [step, setStep] = useState<Step>(isEditing ? 'form' : 'choose');
  const [formData, setFormData] = useState<OfferFormData>({
    ...defaultFormData,
    ...initialData,
    missions: initialData?.missions?.length ? initialData.missions : defaultFormData.missions,
    skills: initialData?.skills?.length ? initialData.skills : defaultFormData.skills,
  });
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);

  const handlePDFParse = (parsedData: any) => {
    setFormData(prev => ({
      ...prev,
      title: parsedData.title || prev.title,
      description: parsedData.description || prev.description,
      missions: parsedData.missions?.length ? parsedData.missions : prev.missions,
      objectives: parsedData.objectives || prev.objectives,
      skills: parsedData.skills?.length ? parsedData.skills : prev.skills,
      studyLevel: parsedData.studyLevel?.length ? parsedData.studyLevel : prev.studyLevel,
      duration: parsedData.duration || prev.duration,
      startDate: parsedData.startDate || prev.startDate,
      salary: parsedData.salary || prev.salary,
      location: parsedData.location || prev.location,
    }));
    setParseSuccess(true);
    // Auto advance to form after successful parse
    setTimeout(() => {
      setStep('form');
    }, 1500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleMissionChange = (index: number, value: string) => {
    const newMissions = [...formData.missions];
    newMissions[index] = value;
    setFormData(prev => ({ ...prev, missions: newMissions }));
  };

  const addMission = () => {
    setFormData(prev => ({ ...prev, missions: [...prev.missions, ''] }));
  };

  const removeMission = (index: number) => {
    if (formData.missions.length > 1) {
      setFormData(prev => ({
        ...prev,
        missions: prev.missions.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const addSkill = () => {
    setFormData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkill = (index: number) => {
    if (formData.skills.length > 1) {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index),
      }));
    }
  };

  const handleStudyLevelChange = (level: string) => {
    const newLevels = formData.studyLevel.includes(level)
      ? formData.studyLevel.filter((l) => l !== level)
      : [...formData.studyLevel, level];
    setFormData(prev => ({ ...prev, studyLevel: newLevels }));
  };

  const generateWithAI = () => {
    setFormData({
      title: 'Analyste Junior - Finance de Marché',
      description:
        'Rejoignez notre équipe de trading pour participer aux activités de marché actions européennes et développer vos compétences en analyse financière.',
      missions: [
        'Analyse des marchés financiers et production de notes de synthèse',
        'Support aux traders sur les opérations de trading actions',
        'Développement d\'outils d\'analyse quantitative sous Python',
        'Participation aux réunions de stratégie de marché',
      ],
      objectives:
        'Acquérir une expérience solide en finance de marché et développer vos compétences analytiques dans un environnement dynamique.',
      reporting: 'Head of Equity Trading',
      studyLevel: ['M1', 'M2'],
      skills: ['Python', 'Excel avancé', 'Bloomberg', 'Analyse financière', 'Anglais courant'],
      contractType: 'alternance',
      duration: '12-24 mois',
      startDate: '2025-09-01',
      location: 'Paris - La Défense',
      remotePolicy: 'hybrid',
      salary: '1400-1600€/mois',
      applicationProcess: 'CV + Lettre de motivation',
      requiresCoverLetter: true,
      managerEmail: '',
    });
    setStep('form');
  };

  const handleFormSubmit = async (e: React.FormEvent, status: 'draft' | 'active' = 'active') => {
    e.preventDefault();
    await onSubmit(formData, status);
  };

  // Step 1: Choose method
  if (step === 'choose') {
    return (
      <div className="space-y-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <span className="font-medium text-gray-900">Méthode de création</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <span className="text-gray-500">Détails de l'offre</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Comment souhaitez-vous créer votre offre ?</h2>
          <p className="text-gray-600">Choisissez la méthode qui vous convient le mieux</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: Upload PDF */}
          <div className={`border-2 rounded-xl p-6 transition group ${
            isParsing ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'
          }`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition ${
                isParsing ? 'bg-blue-200 animate-pulse' : 'bg-blue-100 group-hover:bg-blue-200'
              }`}>
                {isParsing ? (
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isParsing ? 'Analyse IA en cours...' : 'Importer une fiche de poste'}
              </h3>
              <p className="text-sm text-gray-600">
                {isParsing 
                  ? 'Extraction des informations du PDF' 
                  : 'Uploadez un PDF et laissez l\'IA extraire automatiquement les informations'
                }
              </p>
            </div>
            
            <JobOfferPDFParser 
              onParseComplete={handlePDFParse}
              onParsingStart={() => setIsParsing(true)}
              onParsingEnd={() => setIsParsing(false)}
              compact={true}
            />

            {parseSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">Parsing réussi ! Redirection...</span>
              </div>
            )}
          </div>

          {/* Option 2: Manual */}
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PenLine className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Remplir manuellement
              </h3>
              <p className="text-sm text-gray-600">
                Créez votre offre étape par étape avec notre formulaire guidé
              </p>
            </div>
            
            <button
              onClick={() => setStep('form')}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold flex items-center justify-center gap-2"
            >
              Commencer
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* AI option */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={generateWithAI}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Générer avec l'IA (démo)
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Pré-remplir avec des données d'exemple
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Form
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {!isEditing && (
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
              <Check className="h-5 w-5" />
            </div>
            <span className="text-gray-500">Méthode choisie</span>
          </div>
          <div className="w-12 h-0.5 bg-blue-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <span className="font-medium text-gray-900">Détails de l'offre</span>
          </div>
        </div>
      )}

      {/* Back button (only for new offers) */}
      {!isEditing && (
        <button
          type="button"
          onClick={() => {
            setStep('choose');
            setParseSuccess(false);
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au choix de méthode
        </button>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre de l'offre *
          </label>
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Analyste Junior - M&A"
            required
          />
        </div>

        {/* Type et Durée */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de contrat *
            </label>
            <select
              name="contractType"
              value={formData.contractType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="stage">Stage</option>
              <option value="alternance">Alternance</option>
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée *
            </label>
            <input
              name="duration"
              type="text"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 6 mois, 12-24 mois"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Décrivez le poste et le contexte..."
            required
          />
        </div>

        {/* Missions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Missions principales *
          </label>
          <div className="space-y-2">
            {formData.missions.map((mission, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={mission}
                  onChange={(e) => handleMissionChange(index, e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Mission ${index + 1}`}
                  required={index < 1}
                />
                {formData.missions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMission(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMission}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Ajouter une mission
          </button>
        </div>

        {/* Objectifs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Objectifs d'apprentissage
          </label>
          <textarea
            name="objectives"
            value={formData.objectives}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Quels sont les objectifs d'apprentissage ?"
          />
        </div>

        {/* Rattachement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rattachement hiérarchique
          </label>
          <input
            name="reporting"
            type="text"
            value={formData.reporting}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Directeur M&A"
          />
        </div>

        {/* Niveau d'études */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau d'études requis
          </label>
          <div className="flex flex-wrap gap-3">
            {['L3', 'M1', 'M2', 'MBA'].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.studyLevel.includes(level)}
                  onChange={() => handleStudyLevelChange(level)}
                  className="h-4 w-4 text-blue-600 rounded mr-2"
                />
                <span className="text-sm text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Compétences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compétences attendues
          </label>
          <div className="space-y-2">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Compétence ${index + 1}`}
                />
                {formData.skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSkill}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Ajouter une compétence
          </button>
        </div>

        {/* Lieu et Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieu *
            </label>
            <input
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paris, Lyon..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Télétravail
            </label>
            <select
              name="remotePolicy"
              value={formData.remotePolicy}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="on_site">Sur site</option>
              <option value="hybrid">Hybride</option>
              <option value="remote">Full remote</option>
            </select>
          </div>
        </div>

        {/* Date de début et Rémunération */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rémunération
            </label>
            <input
              name="salary"
              type="text"
              value={formData.salary}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 1200-1400€/mois"
            />
          </div>
        </div>

        {/* Options de candidature */}
        <div className="bg-slate-50 p-6 rounded-xl space-y-4">
          <h3 className="font-semibold text-slate-900">Options de candidature</h3>
          
          {/* Lettre de motivation obligatoire */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="requiresCoverLetter"
              checked={formData.requiresCoverLetter}
              onChange={(e) => setFormData(prev => ({ ...prev, requiresCoverLetter: e.target.checked }))}
              className="h-5 w-5 text-blue-600 rounded mt-0.5"
            />
            <div>
              <label htmlFor="requiresCoverLetter" className="font-medium text-gray-900 cursor-pointer">
                Lettre de motivation obligatoire
              </label>
              <p className="text-sm text-gray-500">
                Les candidats devront obligatoirement fournir une lettre de motivation
              </p>
            </div>
          </div>

          {/* Email du responsable hiérarchique */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email du responsable hiérarchique (optionnel)
            </label>
            <input
              name="managerEmail"
              type="email"
              value={formData.managerEmail}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="manager@entreprise.com"
            />
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
              <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v4m12 0a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2h12a2 2 0 012 2v4z" />
              </svg>
              Usage interne uniquement - Non visible par les candidats
            </p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={(e) => handleFormSubmit(e, 'draft')}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            Enregistrer brouillon
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Send className="h-5 w-5 mr-2" />
            )}
            {isEditing ? 'Enregistrer les modifications' : 'Publier l\'offre'}
          </button>
        </div>
      </form>
    </div>
  );
}
