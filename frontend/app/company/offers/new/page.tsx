'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobOfferPDFParser from '@/components/job/JobOfferPDFParser';
import { Sparkles, Send } from 'lucide-react';

export default function NewOfferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    missions: ['', '', ''],
    objectives: '',
    reporting: '',
    studyLevel: [] as string[],
    skills: [''],
    contractType: 'stage',
    duration: '',
    startDate: '',
    location: '',
    salary: '',
    applicationProcess: 'CV + Lettre de motivation',
  });

  const [showPDFParser, setShowPDFParser] = useState(true);

  const handlePDFParse = (parsedData: any) => {
    setFormData({
      ...formData,
      title: parsedData.title || formData.title,
      description: parsedData.description || formData.description,
      missions: parsedData.missions || formData.missions,
      objectives: parsedData.objectives || formData.objectives,
      skills: parsedData.skills || formData.skills,
      studyLevel: parsedData.studyLevel || formData.studyLevel,
      duration: parsedData.duration || formData.duration,
      startDate: parsedData.startDate || formData.startDate,
      salary: parsedData.salary || formData.salary,
      location: parsedData.location || formData.location,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMissionChange = (index: number, value: string) => {
    const newMissions = [...formData.missions];
    newMissions[index] = value;
    setFormData({ ...formData, missions: newMissions });
  };

  const addMission = () => {
    setFormData({ ...formData, missions: [...formData.missions, ''] });
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData({ ...formData, skills: newSkills });
  };

  const addSkill = () => {
    setFormData({ ...formData, skills: [...formData.skills, ''] });
  };

  const handleStudyLevelChange = (level: string) => {
    const newLevels = formData.studyLevel.includes(level)
      ? formData.studyLevel.filter((l) => l !== level)
      : [...formData.studyLevel, level];
    setFormData({ ...formData, studyLevel: newLevels });
  };

  const generateWithAI = () => {
    // Simulation de génération IA
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
      salary: '1400-1600€/mois',
      applicationProcess: 'CV + Lettre de motivation',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Offre publiée avec succès !');
    router.push('/company/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Publier une nouvelle offre</h1>
            <p className="text-gray-600">
              Créez une offre de stage ou d'alternance attractive pour les candidats
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* PDF Parser */}
            {showPDFParser && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Option 1 : Upload d'une fiche de poste PDF
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPDFParser(false)}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Passer cette étape
                  </button>
                </div>
                <JobOfferPDFParser onParseComplete={handlePDFParse} />
              </div>
            )}

            {/* Séparateur */}
            {showPDFParser && (
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Ou</span>
                </div>
              </div>
            )}

            {/* AI Generation Button */}
            <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                    Option 2 : Génération automatique par IA
                  </h3>
                  <p className="text-sm text-gray-600">
                    Gagnez du temps en pré-remplissant le formulaire avec des données réalistes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateWithAI}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold flex items-center whitespace-nowrap"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Générer
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="stage">Stage</option>
                    <option value="alternance">Alternance</option>
                    <option value="apprentissage">Apprentissage</option>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <input
                      key={index}
                      type="text"
                      value={mission}
                      onChange={(e) => handleMissionChange(index, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Mission ${index + 1}`}
                      required={index < 3}
                    />
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
                  Objectifs *
                </label>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quels sont les objectifs d'apprentissage ?"
                  required
                />
              </div>

              {/* Rattachement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rattachement hiérarchique *
                </label>
                <input
                  name="reporting"
                  type="text"
                  value={formData.reporting}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Directeur M&A"
                  required
                />
              </div>

              {/* Niveau d'études */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'études requis *
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
                  Compétences attendues *
                </label>
                <div className="space-y-2">
                  {formData.skills.map((skill, index) => (
                    <input
                      key={index}
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Compétence ${index + 1}`}
                      required={index === 0}
                    />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paris, Lyon..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Rémunération */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rémunération (optionnel)
                </label>
                <input
                  name="salary"
                  type="text"
                  value={formData.salary}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 1200-1400€/mois"
                />
              </div>

              {/* Modalités */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalités de candidature *
                </label>
                <input
                  name="applicationProcess"
                  type="text"
                  value={formData.applicationProcess}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="CV + Lettre de motivation"
                  required
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Publier l'offre
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
