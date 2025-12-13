'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Mail, Lock, User, Briefcase, AlertCircle, Loader2, Shield, CheckCircle, ChevronDown, HelpCircle, Linkedin, Info } from 'lucide-react';
import { registerCompanyUser, signInWithGoogle, signInWithMicrosoft, signInWithLinkedIn } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import Captcha, { CAPTCHA_SITE_KEYS, CAPTCHA_CONFIG } from '@/components/security/Captcha';
import { checkPersistentRateLimit, formatWaitTime, clearPersistentRateLimit } from '@/lib/rateLimit';

type CompanyRole = 'company' | 'rh' | 'manager';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { setUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  
  // Formulaire simplifié : nom, rôle, email, mot de passe
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'rh' as CompanyRole,
  });

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setRateLimitError('');
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  // Handlers OAuth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle(`${window.location.origin}/auth/callback?type=company`);
    } catch (err) {
      setError('Erreur lors de la connexion avec Google');
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithMicrosoft(`${window.location.origin}/auth/callback?type=company`);
    } catch (err) {
      setError('Erreur lors de la connexion avec Microsoft');
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithLinkedIn(`${window.location.origin}/auth/callback?type=company`);
    } catch (err) {
      setError('Erreur lors de la connexion avec LinkedIn');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRateLimitError('');

    // Vérification du rate limit côté client
    const rateCheck = checkPersistentRateLimit('register-company', {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000,
      lockoutMs: 30 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      setRateLimitError(`Trop de tentatives. Réessayez dans ${formatWaitTime(rateCheck.waitMs)}.`);
      return;
    }

    // Vérification du captcha (si activé)
    if (CAPTCHA_CONFIG.enabled && !captchaToken) {
      setRateLimitError('Veuillez compléter la vérification de sécurité.');
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }

    setIsLoading(true);

    try {
      // Inscription simplifiée - création du compte utilisateur uniquement
      const result = await registerCompanyUser(formData.email, formData.password, {
        fullName: formData.fullName,
        role: formData.role,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'inscription');
      }

      // Inscription réussie - nettoyer le rate limit
      clearPersistentRateLimit('register-company');

      // Enregistrer le rôle dans le contexte
      setUserRole('company');

      // Rediriger vers la page de vérification email
      // Après validation, l'utilisateur sera redirigé vers /company/onboarding
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&type=company`);

    } catch (err: unknown) {
      console.error('Erreur inscription:', err);
      const errorMessage = (err as Error).message || '';
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        setRateLimitError('Trop de tentatives. Veuillez patienter avant de réessayer.');
      } else {
        setError(errorMessage || 'Une erreur est survenue lors de l\'inscription');
      }
      setCaptchaToken(null);
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Titre */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Inscription Entreprise</h1>
              <p className="text-gray-600 mt-2">
                Créez votre compte pour recruter les meilleurs talents
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Connexion sociale */}
            <div className="mb-8">
              <p className="text-sm text-gray-600 text-center mb-4">
                Inscription rapide avec votre compte professionnel
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleMicrosoftSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Microsoft</span>
                </button>

                <button
                  type="button"
                  onClick={handleLinkedInSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                  <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Séparateur */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou créez un compte avec votre email</span>
              </div>
            </div>

            {/* Formulaire simplifié */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nom complet */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom et prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Marie Dupont"
                    required
                  />
                </div>
              </div>

              {/* Rôle dans l'entreprise */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Votre rôle dans l'entreprise *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    required
                  >
                    <option value="rh">RH / Recruteur</option>
                    <option value="manager">Manager / Responsable d'équipe</option>
                    <option value="company">Direction / Administration</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Email professionnel */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email professionnel *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="marie.dupont@entreprise.com"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Utilisez votre email professionnel pour être automatiquement rattaché à votre entreprise
                </p>
              </div>

              {/* Mot de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Note sur le processus */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Après validation de votre email :</p>
                    <ul className="mt-1 space-y-1 text-blue-700">
                      <li>• Si votre entreprise existe déjà, vous pourrez la rejoindre</li>
                      <li>• Sinon, vous pourrez créer la fiche entreprise</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CGU */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 mt-1 text-purple-600 rounded"
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  J'accepte les{' '}
                  <Link href="/legal/cgu" className="text-purple-600 hover:text-purple-700">
                    CGU
                  </Link>{' '}
                  et la{' '}
                  <Link href="/legal/privacy" className="text-purple-600 hover:text-purple-700">
                    politique de confidentialité
                  </Link>
                </label>
              </div>

              {/* Captcha (si activé) */}
              {CAPTCHA_CONFIG.enabled && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Shield className="h-4 w-4" />
                    <span>Vérification de sécurité</span>
                  </div>
                  <div ref={captchaRef}>
                    <Captcha
                      siteKey={CAPTCHA_SITE_KEYS.hcaptcha}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      onError={(err) => setRateLimitError(`Erreur captcha: ${err}`)}
                    />
                  </div>
                  {captchaToken && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Vérification réussie</span>
                    </div>
                  )}
                </div>
              )}

              {/* Rate limit error */}
              {rateLimitError && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{rateLimitError}</span>
                </div>
              )}

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={isLoading || (CAPTCHA_CONFIG.enabled && !captchaToken)}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte entreprise'
                )}
              </button>
            </form>

            {/* Lien connexion */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link href="/login-company" className="text-blue-600 hover:text-blue-700 font-medium">
                Se connecter
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Questions fréquentes</h2>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  question: "Comment publier une offre de stage ou d'alternance ?",
                  answer: "Une fois inscrit, accédez à votre tableau de bord et cliquez sur 'Nouvelle offre'. Vous pourrez remplir les détails du poste ou importer une fiche de poste PDF qui sera automatiquement analysée."
                },
                {
                  question: "La publication d'offres est-elle gratuite ?",
                  answer: "Oui, la publication d'offres de stage et d'alternance est entièrement gratuite. Pour les CDI et services premium (chasse, RPO, évaluation), contactez-nous pour un devis personnalisé."
                },
                {
                  question: "Comment accéder aux profils des candidats ?",
                  answer: "Les candidats postulent directement à vos offres. Vous recevez leurs candidatures dans votre espace entreprise avec accès à leur CV, lettre de motivation et profil complet."
                },
                {
                  question: "Quel est le délai moyen de recrutement ?",
                  answer: "Grâce à notre vivier de candidats pré-qualifiés issus des meilleures écoles, le délai moyen est de 2 semaines entre la publication et la proposition d'embauche."
                },
                {
                  question: "Proposez-vous des services de recrutement sur-mesure ?",
                  answer: "Oui, nous proposons des services de chasse, RPO (recrutement externalisé), évaluation de profils et direction financière à temps partagé. Contactez-nous pour en savoir plus."
                },
              ].map((faq, index) => (
                <details 
                  key={index}
                  className="group border border-gray-200 rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-gray-50 transition">
                    <span className="font-medium text-slate-900 pr-4 text-sm">{faq.question}</span>
                    <ChevronDown className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-4 pb-4 text-slate-600 font-light text-sm leading-relaxed border-t border-gray-100 pt-3">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
