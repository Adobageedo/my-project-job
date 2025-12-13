'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import {
  getHomepageConfig,
  saveHomepageConfig,
  resetHomepageConfig,
  HomepageConfig,
  DEFAULT_HOMEPAGE_CONFIG,
} from '@/services/homepageService';
import {
  Loader2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Home,
  BarChart3,
  Briefcase,
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  ExternalLink,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

type SectionKey = 'hero' | 'stats' | 'offers' | 'alternance' | 'services' | 'formations' | 'about';

interface SectionConfig {
  key: SectionKey;
  title: string;
  icon: React.ReactNode;
  hasVisibility: boolean;
}

const SECTIONS: SectionConfig[] = [
  { key: 'hero', title: 'Hero (En-tête)', icon: <Home className="h-5 w-5" />, hasVisibility: false },
  { key: 'stats', title: 'Statistiques', icon: <BarChart3 className="h-5 w-5" />, hasVisibility: true },
  { key: 'offers', title: 'Offres récentes', icon: <Briefcase className="h-5 w-5" />, hasVisibility: true },
  { key: 'alternance', title: 'Alternance & Stage', icon: <GraduationCap className="h-5 w-5" />, hasVisibility: true },
  { key: 'services', title: 'Services Entreprises', icon: <Building2 className="h-5 w-5" />, hasVisibility: true },
  { key: 'formations', title: 'Formations Candidats', icon: <BookOpen className="h-5 w-5" />, hasVisibility: true },
  { key: 'about', title: 'À propos', icon: <Users className="h-5 w-5" />, hasVisibility: true },
];

export default function AdminHomepagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['hero']));
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getHomepageConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    const result = await saveHomepageConfig(config, user.id);
    
    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Configuration sauvegardée !' });
      setHasChanges(false);
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Erreur lors de la sauvegarde' });
    }
    
    setSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = async () => {
    if (!user?.id) return;
    if (!confirm('Réinitialiser la configuration par défaut ? Cette action est irréversible.')) return;
    
    setSaving(true);
    const result = await resetHomepageConfig(user.id);
    
    if (result.success) {
      setConfig(DEFAULT_HOMEPAGE_CONFIG);
      setSaveMessage({ type: 'success', text: 'Configuration réinitialisée' });
      setHasChanges(false);
    }
    
    setSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const toggleSection = (key: SectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const toggleVisibility = (key: SectionKey) => {
    setConfig(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        visible: !(prev[key] as { visible?: boolean }).visible,
      },
    }));
    setHasChanges(true);
  };

  const updateField = (section: SectionKey, field: string, value: unknown) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateArrayItem = (section: SectionKey, arrayField: string, index: number, value: string) => {
    setConfig(prev => {
      const sectionData = prev[section] as unknown as Record<string, unknown>;
      const array = [...(sectionData[arrayField] as string[])];
      array[index] = value;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [arrayField]: array,
        },
      };
    });
    setHasChanges(true);
  };

  const addArrayItem = (section: SectionKey, arrayField: string, defaultValue: string = '') => {
    setConfig(prev => {
      const sectionData = prev[section] as unknown as Record<string, unknown>;
      const array = [...(sectionData[arrayField] as string[]), defaultValue];
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [arrayField]: array,
        },
      };
    });
    setHasChanges(true);
  };

  const removeArrayItem = (section: SectionKey, arrayField: string, index: number) => {
    setConfig(prev => {
      const sectionData = prev[section] as unknown as Record<string, unknown>;
      const array = (sectionData[arrayField] as string[]).filter((_, i) => i !== index);
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [arrayField]: array,
        },
      };
    });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="admin" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="admin" />

      <div className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Page d'accueil</h1>
              <p className="text-gray-600 mt-1">Configurez le contenu et la visibilité des sections</p>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Prévisualiser
              </a>
              
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Save message */}
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {saveMessage.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              {saveMessage.text}
            </div>
          )}

          {/* Sections */}
          <div className="space-y-4">
            {SECTIONS.map((section) => (
              <div key={section.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleSection(section.key)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      {section.icon}
                    </div>
                    <span className="font-medium text-slate-900">{section.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {section.hasVisibility && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(section.key);
                        }}
                        className={`p-2 rounded-lg transition ${
                          (config[section.key] as { visible?: boolean }).visible
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={
                          (config[section.key] as { visible?: boolean }).visible
                            ? 'Section visible'
                            : 'Section masquée'
                        }
                      >
                        {(config[section.key] as { visible?: boolean }).visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    
                    {expandedSections.has(section.key) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.has(section.key) && (
                  <div className="p-4 pt-0 border-t border-gray-100">
                    {renderSectionEditor(section.key)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );

  // Render section-specific editor
  function renderSectionEditor(key: SectionKey) {
    switch (key) {
      case 'hero':
        return (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal</label>
              <input
                type="text"
                value={config.hero.title}
                onChange={(e) => updateField('hero', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <input
                type="text"
                value={config.hero.subtitle}
                onChange={(e) => updateField('hero', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={config.hero.description}
                onChange={(e) => updateField('hero', 'description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={config.hero.showCandidateButton}
                    onChange={(e) => updateField('hero', 'showCandidateButton', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Bouton Candidat</span>
                </label>
                {config.hero.showCandidateButton && (
                  <input
                    type="text"
                    value={config.hero.candidateButtonText}
                    onChange={(e) => updateField('hero', 'candidateButtonText', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Texte du bouton"
                  />
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={config.hero.showCompanyButton}
                    onChange={(e) => updateField('hero', 'showCompanyButton', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Bouton Entreprise</span>
                </label>
                {config.hero.showCompanyButton && (
                  <input
                    type="text"
                    value={config.hero.companyButtonText}
                    onChange={(e) => updateField('hero', 'companyButtonText', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Texte du bouton"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'offers':
        return (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={config.offers.title}
                onChange={(e) => updateField('offers', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <input
                type="text"
                value={config.offers.subtitle}
                onChange={(e) => updateField('offers', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'offres à afficher</label>
              <input
                type="number"
                min={1}
                max={10}
                value={config.offers.showCount}
                onChange={(e) => updateField('offers', 'showCount', parseInt(e.target.value) || 5)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'alternance':
        return (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={config.alternance.title}
                onChange={(e) => updateField('alternance', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <input
                type="text"
                value={config.alternance.subtitle}
                onChange={(e) => updateField('alternance', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avantages</label>
              {config.alternance.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateArrayItem('alternance', 'benefits', index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeArrayItem('alternance', 'benefits', index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem('alternance', 'benefits', 'Nouvel avantage')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="h-4 w-4" />
                Ajouter un avantage
              </button>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={config.services.title}
                onChange={(e) => updateField('services', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <textarea
                value={config.services.subtitle}
                onChange={(e) => updateField('services', 'subtitle', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secteurs d'intervention</label>
              <div className="flex flex-wrap gap-2">
                {config.services.sectors.map((sector, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm">{sector}</span>
                    <button
                      onClick={() => removeArrayItem('services', 'sectors', index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Nouveau secteur"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addArrayItem('services', 'sectors', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'formations':
        return (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={config.formations.title}
                onChange={(e) => updateField('formations', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
              <textarea
                value={config.formations.subtitle}
                onChange={(e) => updateField('formations', 'subtitle', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={config.about.title}
                onChange={(e) => updateField('about', 'title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={config.about.description}
                onChange={(e) => updateField('about', 'description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notre vision</label>
              <textarea
                value={config.about.vision}
                onChange={(e) => updateField('about', 'vision', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              Les statistiques sont calculées automatiquement à partir des données de la plateforme.
              Vous pouvez uniquement activer ou désactiver cette section.
            </p>
          </div>
        );

      default:
        return null;
    }
  }
}
