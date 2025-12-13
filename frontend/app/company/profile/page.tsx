'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { getCurrentCompany, updateCompanyProfile, Company } from '@/services/companyService';
import { uploadCompanyLogo, updateCompanyLogoUrl, deleteCompanyLogo } from '@/services/uploadService';
import { getCurrentUserPermissions, UserPermissions } from '@/services/permissionsService';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Mail, User, Briefcase, Users, Shield, ChevronRight, Loader2, Globe, Linkedin, ExternalLink, Image, Upload, X, Link as LinkIcon, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CompanyProfilePage() {
  const router = useRouter();
  const { refreshCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    size: '',
    contact_name: '',
    contact_email: '',
    description: '',
    website: '',
    linkedin_url: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Logo state
  const [logoMode, setLogoMode] = useState<'file' | 'url'>('file');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);

  // Vérifier si l'utilisateur peut éditer
  const canEdit = permissions?.is_owner || permissions?.is_primary_contact || permissions?.permissions.can_edit_company_profile;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger en parallèle
        const [companyData, userPermissions] = await Promise.all([
          getCurrentCompany(),
          getCurrentUserPermissions(),
        ]);
        
        if (!companyData) {
          router.push('/login-company');
          return;
        }
        
        setCompany(companyData);
        setPermissions(userPermissions);
        setFormData({
          name: companyData.name || '',
          sector: companyData.sector || '',
          size: companyData.size || '',
          contact_name: companyData.contact_name || '',
          contact_email: companyData.contact_email || '',
          description: companyData.description || '',
          website: companyData.website || '',
          linkedin_url: companyData.linkedin_url || '',
        });
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    const result = await updateCompanyProfile(company.id, formData);
    setSaving(false);

    if (result.success) {
      setIsEditing(false);
      // Reload company data
      const updated = await getCurrentCompany();
      if (updated) setCompany(updated);
    } else {
      alert('Erreur: ' + result.error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Logo handlers
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoUrl('');
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    setLogoFile(null);
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  const handleLogoSave = async () => {
    if (!company || (!logoFile && !logoUrl)) return;
    
    setUploadingLogo(true);
    try {
      const source = logoFile || logoUrl;
      const result = await uploadCompanyLogo(company.id, source);
      
      if (result.success && result.url) {
        await updateCompanyLogoUrl(company.id, result.url);
        setCompany({ ...company, logo_url: result.url });
        await refreshCompany();
        setShowLogoEditor(false);
        setLogoFile(null);
        setLogoUrl('');
        setLogoPreview(null);
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error) {
      alert('Erreur lors de l\'upload');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!company?.logo_url) return;
    
    if (!confirm('Supprimer le logo ?')) return;
    
    setUploadingLogo(true);
    try {
      await deleteCompanyLogo(company.logo_url);
      await updateCompanyLogoUrl(company.id, null);
      setCompany({ ...company, logo_url: null });
      await refreshCompany();
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar role="company" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="company" />

      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Logo */}
          <div className="mb-8 flex items-start gap-6">
            {/* Logo Section */}
            <div className="relative group">
              {company?.logo_url ? (
                <div className="relative">
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-24 w-24 rounded-xl object-contain bg-white border border-gray-200"
                  />
                  {canEdit && (
                    <button
                      onClick={() => setShowLogoEditor(true)}
                      className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <Upload className="h-6 w-6 text-white" />
                    </button>
                  )}
                </div>
              ) : canEdit ? (
                <button
                  onClick={() => setShowLogoEditor(true)}
                  className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Image className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Ajouter</span>
                </button>
              ) : (
                <div className="h-24 w-24 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Profil Entreprise</h1>
              <p className="text-gray-600">
                Gérez les informations de votre entreprise
              </p>
            </div>
          </div>

          {/* Logo Editor Modal */}
          {showLogoEditor && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Modifier le logo</h3>
                  <button onClick={() => { setShowLogoEditor(false); setLogoPreview(null); setLogoFile(null); setLogoUrl(''); }}>
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Toggle fichier / URL */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setLogoMode('file')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      logoMode === 'file' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Upload className="h-4 w-4 inline mr-2" />
                    Fichier
                  </button>
                  <button
                    onClick={() => setLogoMode('url')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      logoMode === 'url' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <LinkIcon className="h-4 w-4 inline mr-2" />
                    URL
                  </button>
                </div>

                {logoMode === 'file' ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <Image className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Cliquez pour choisir</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoFileChange} />
                  </label>
                ) : (
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  />
                )}

                {logoPreview && (
                  <div className="mt-4 flex justify-center">
                    <img src={logoPreview} alt="Preview" className="h-20 w-20 object-contain rounded-lg border" />
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {company?.logo_url && (
                    <button
                      onClick={handleLogoDelete}
                      disabled={uploadingLogo}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Supprimer
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={() => { setShowLogoEditor(false); setLogoPreview(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleLogoSave}
                    disabled={uploadingLogo || (!logoFile && !logoUrl)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Permission Warning */}
          {!canEdit && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium">Accès en lecture seule</p>
                <p className="text-amber-700 text-sm">
                  Seul l'administrateur de l'entreprise peut modifier ces informations. 
                  Contactez votre responsable si des modifications sont nécessaires.
                </p>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-slate-900">Informations de l'entreprise</h2>
              {canEdit && !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Modifier
                </button>
              ) : canEdit && isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      if (company) {
                        setFormData({
                          name: company.name || '',
                          sector: company.sector || '',
                          size: company.size || '',
                          contact_name: company.contact_name || '',
                          contact_email: company.contact_email || '',
                          description: company.description || '',
                          website: company.website || '',
                          linkedin_url: company.linkedin_url || '',
                        });
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations entreprise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Nom de l'entreprise
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Secteur d'activité
                  </label>
                  <input
                    name="sector"
                    type="text"
                    value={formData.sector}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline h-4 w-4 mr-1" />
                    Taille de l'entreprise
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  >
                    <option value="1-50">1-50 employés</option>
                    <option value="50-250">50-250 employés</option>
                    <option value="250-1000">250-1000 employés</option>
                    <option value="1000-5000">1000-5000 employés</option>
                    <option value="5000-10000">5000-10000 employés</option>
                    <option value="10000+">10000+ employés</option>
                  </select>
                </div>
              </div>

              {/* Liens externes */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Présence en ligne
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline h-4 w-4 mr-1" />
                    Site internet
                  </label>
                  <div className="relative">
                    <input
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="https://www.example.com"
                      className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                        isEditing
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          : 'bg-gray-50'
                      }`}
                    />
                    {formData.website && !isEditing && (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Linkedin className="inline h-4 w-4 mr-1" />
                    Page LinkedIn
                  </label>
                  <div className="relative">
                    <input
                      name="linkedin_url"
                      type="url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="https://www.linkedin.com/company/..."
                      className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                        isEditing
                          ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          : 'bg-gray-50'
                      }`}
                    />
                    {formData.linkedin_url && !isEditing && (
                      <a
                        href={formData.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Administrateur de l'entreprise
                </h3>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Nom et prénom
                </label>
                <input
                  name="contact_name"
                  type="text"
                  value={formData.contact_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                    isEditing
                      ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      : 'bg-gray-50'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md ${
                      isEditing
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'bg-gray-50'
                    }`}
                  />
                </div>

              </div>
            </form>
          </div>

          {/* Section RGPD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Protection des données (RGPD)</h3>
                  <p className="text-sm text-gray-600">Gérez vos données personnelles, exportez-les ou supprimez votre compte</p>
                </div>
              </div>
              <Link
                href="/company/gdpr"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                Paramètres RGPD
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
