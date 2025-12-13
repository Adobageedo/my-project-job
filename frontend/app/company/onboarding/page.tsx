'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import {
  Building2,
  Briefcase,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertTriangle,
  Crown,
  Globe,
  Linkedin,
  Mail,
  User,
  Image,
  Link as LinkIcon,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkCompanyByEmailDomain,
  joinExistingCompany,
  createCompanyAndLink,
  checkSiretExists,
} from '@/services/authService';
import { uploadCompanyLogo, updateCompanyLogoUrl } from '@/services/uploadService';

type Step = 'loading' | 'company-found' | 'create-company' | 'success';

interface FoundCompany {
  id: string;
  name: string;
  sector: string | null;
  size: string | null;
  logo_url: string | null;
}

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [foundCompany, setFoundCompany] = useState<FoundCompany | null>(null);

  // Formulaire nouvelle entreprise - mêmes champs que le profil
  const [companyData, setCompanyData] = useState({
    name: '',
    siret: '',
    sector: '',
    size: '50-250',
    website: '',
    linkedin_url: '',
    contact_name: '',
    contact_email: '',
    description: '',
  });

  // Logo state
  const [logoMode, setLogoMode] = useState<'file' | 'url'>('file');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);


  // Utiliser AuthContext pour la gestion de l'authentification
  const { user, isLoading: authLoading, logout } = useAuth();

  // Déconnexion
  const handleLogout = async () => {
    await logout();
  };

  // Flag pour éviter les appels multiples
  const [initialized, setInitialized] = useState(false);

  // Charger les données de l'entreprise quand l'utilisateur est disponible
  useEffect(() => {
    // Éviter les appels multiples
    if (initialized) {
      return;
    }
    
    const init = async () => {      
      // Attendre que AuthContext ait fini de charger
      if (authLoading) {
        return;
      }
      
      // Si pas d'utilisateur, rediriger vers login
      if (!user) {
        router.push('/login-company');
        return;
      }

      // Vérifier que c'est bien un utilisateur entreprise
      if (user.role !== 'company') {
        router.push('/login-candidate');
        return;
      }

      // Marquer comme initialisé pour éviter les boucles
      setInitialized(true);

      // Définir les infos utilisateur
      setUserId(user.id);
      setUserEmail(user.email);
      
      // Pré-remplir les champs contact avec les infos de l'utilisateur
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      
      // Extraire le domaine de l'email pour pré-remplir le site web
      let websiteFromEmail = '';
      if (user.email) {
        const emailDomain = user.email.split('@')[1];
        // Exclure les domaines génériques (gmail, yahoo, hotmail, etc.)
        const genericDomains = ['gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'icloud.com', 'me.com', 'msn.com', 'aol.com', 'orange.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'wanadoo.fr'];
        if (emailDomain && !genericDomains.includes(emailDomain.toLowerCase())) {
          websiteFromEmail = `https://${emailDomain}`;
        }
      }
      
      setCompanyData(prev => ({
        ...prev,
        contact_name: fullName,
        contact_email: user.email || '',
        website: websiteFromEmail,
      }));

      // Vérifier si une entreprise existe avec ce domaine email
      try {
        const domainCheck = await checkCompanyByEmailDomain(user.email);
        
        if (domainCheck.exists && domainCheck.company) {
          setFoundCompany(domainCheck.company);
          setStep('company-found');
        } else {
          setStep('create-company');
        }
      } catch (err) {
        console.error('Error during domain check:', err);
        // En cas d'erreur, afficher le formulaire de création
        setStep('create-company');
      }
    };

    init();
  }, [user, authLoading, initialized, router]);

  // Nettoyage du SIRET (uniquement chiffres)
  const handleSiretChange = (value: string) => {
    const cleanSiret = value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    setCompanyData({ ...companyData, siret: cleanSiret });
  };

  // Gestion du fichier logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoUrl('');
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Gestion de l'URL du logo
  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    setLogoFile(null);
    // Preview depuis l'URL
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  // Supprimer le logo
  const clearLogo = () => {
    setLogoFile(null);
    setLogoUrl('');
    setLogoPreview(null);
  };

  // Rejoindre l'entreprise existante
  const handleJoinCompany = async () => {
    if (!userId || !foundCompany) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await joinExistingCompany(userId, foundCompany.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setStep('success');
      setTimeout(() => {
        router.push('/company/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors du rattachement');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer une nouvelle entreprise
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;

    if (!companyData.name || !companyData.siret || !companyData.sector) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (companyData.siret.length !== 14) {
      setError('Le SIRET doit contenir 14 chiffres');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Vérifier si le SIRET existe déjà
    try {
      const siretCheck = await checkSiretExists(companyData.siret);
      if (siretCheck.exists) {
        setError('Une entreprise existe déjà avec ce SIRET. Vérifiez votre numéro ou contactez l\'administrateur.');
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('Erreur vérification SIRET:', err);
    }

    try {
      const result = await createCompanyAndLink(userId, companyData, userEmail);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Upload du logo si présent
      if (result.companyId && (logoFile || logoUrl)) {
        setUploadingLogo(true);
        const logoSource = logoFile || logoUrl;
        const uploadResult = await uploadCompanyLogo(result.companyId, logoSource);
        
        if (uploadResult.success && uploadResult.url) {
          await updateCompanyLogoUrl(result.companyId, uploadResult.url);
        }
        setUploadingLogo(false);
      }

      setStep('success');
      setTimeout(() => {
        router.push('/company/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
      setUploadingLogo(false);
    }
  };

  // Choisir de créer une nouvelle entreprise au lieu de rejoindre
  const handleCreateNew = () => {
    setFoundCompany(null);
    setStep('create-company');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* NavBar en mode minimal */}
      <NavBar minimal onLogout={handleLogout} />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Loading */}
          {step === 'loading' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
              <p className="text-gray-600 mt-2">Vérification de votre compte</p>
              
              {/* Bouton de secours après 5 secondes */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">Le chargement prend trop de temps ?</p>
                <button
                  onClick={handleLogout}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Se déconnecter et réessayer
                </button>
              </div>
            </div>
          )}

          {/* Entreprise trouvée */}
          {step === 'company-found' && foundCompany && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Entreprise détectée</h1>
                <p className="text-gray-600 mt-2">
                  Nous avons trouvé une entreprise correspondant à votre domaine email
                </p>
              </div>

              {/* Fiche entreprise */}
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  {foundCompany.logo_url ? (
                    <img
                      src={foundCompany.logo_url}
                      alt={foundCompany.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{foundCompany.name}</h3>
                    {foundCompany.sector && (
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <Briefcase className="h-4 w-4" />
                        {foundCompany.sector}
                      </p>
                    )}
                    {foundCompany.size && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {foundCompany.size} employés
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    En rejoignant cette entreprise, vous aurez accès aux offres et candidatures.
                    L'administrateur de l'entreprise pourra ajuster vos permissions.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleJoinCompany}
                  disabled={isLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      C'est mon entreprise - Rejoindre
                    </>
                  )}
                </button>

                <button
                  onClick={handleCreateNew}
                  disabled={isLoading}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Ce n'est pas mon entreprise - Créer une nouvelle fiche
                </button>
              </div>
            </div>
          )}

          {/* Créer une entreprise */}
          {step === 'create-company' && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Créer votre entreprise</h1>
                <p className="text-gray-600 mt-2">
                  Renseignez les informations de votre entreprise
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Vous devenez le référent de l'entreprise</p>
                    <p className="mt-1">Seul le référent peut modifier les informations de l'entreprise. Ce rôle est transférable.</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateCompany} className="space-y-5">
                {/* Logo de l'entreprise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de l'entreprise
                  </label>
                  
                  {/* Toggle fichier / URL */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setLogoMode('file')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        logoMode === 'file'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <Upload className="h-4 w-4 inline mr-2" />
                      Importer un fichier
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode('url')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        logoMode === 'url'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-2" />
                      URL du logo
                    </button>
                  </div>

                  <div className="flex gap-4">
                    {/* Zone d'upload / URL */}
                    <div className="flex-1">
                      {logoMode === 'file' ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Image className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-blue-600">Cliquez</span> ou glissez-déposez
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG (max 2MB)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                            onChange={handleLogoFileChange}
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => handleLogoUrlChange(e.target.value)}
                            className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {logoPreview && (
                      <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        <img
                          src={logoPreview}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                          onError={() => setLogoPreview(null)}
                        />
                        <button
                          type="button"
                          onClick={clearLogo}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nom de l'entreprise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="BNP Paribas"
                      required
                    />
                  </div>
                </div>

                {/* SIRET */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de SIRET *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={companyData.siret}
                      onChange={(e) => handleSiretChange(e.target.value)}
                      maxLength={14}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12345678901234"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    14 chiffres - Le SIRET garantit l'unicité de votre entreprise
                  </p>
                </div>

                {/* Secteur et taille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur d'activité *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={companyData.sector}
                        onChange={(e) => setCompanyData({ ...companyData, sector: e.target.value })}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Finance"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={companyData.size}
                        onChange={(e) => setCompanyData({ ...companyData, size: e.target.value })}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
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
                </div>

                {/* Présence en ligne */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Présence en ligne</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site internet
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={companyData.website}
                          onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://www.example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page LinkedIn
                      </label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={companyData.linkedin_url}
                          onChange={(e) => setCompanyData({ ...companyData, linkedin_url: e.target.value })}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interlocuteur principal */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Interlocuteur principal</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom et prénom
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={companyData.contact_name}
                          onChange={(e) => setCompanyData({ ...companyData, contact_name: e.target.value })}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Marie Dupont"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de contact
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={companyData.contact_email}
                          onChange={(e) => setCompanyData({ ...companyData, contact_email: e.target.value })}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="contact@entreprise.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || uploadingLogo}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading || uploadingLogo ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {uploadingLogo ? 'Upload du logo...' : 'Création...'}
                    </>
                  ) : (
                    <>
                      Créer l'entreprise
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              {foundCompany && (
                <button
                  onClick={() => setStep('company-found')}
                  className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Revenir à l'entreprise détectée
                </button>
              )}
            </div>
          )}

          {/* Succès */}
          {step === 'success' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configuration terminée !
              </h2>
              <p className="text-gray-600 mb-4">
                Vous allez être redirigé vers votre tableau de bord...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Footer minimaliste */}
      <footer className="py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} JobTeaser • 
        <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
        {' • '}
        <Link href="/contact" className="hover:underline">Contact</Link>
      </footer>
    </div>
  );
}
