'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { registerCandidate } from '@/services/authService';

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isStrong: boolean;
}

export default function RegisterCandidatePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Validation du mot de passe
  const validatePassword = (pwd: string): PasswordValidation => {
    return {
      minLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      isStrong: pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    // Vérification finale du mot de passe
    if (!passwordValidation.isStrong) {
      return;
    }

    if (!passwordsMatch) {
      return;
    }

    setIsLoading(true);

    try {
      // Utiliser le service d'authentification
      await registerCandidate(email, password);

      // Redirection vers la page de confirmation
      router.push('/register/candidate/confirm-email');
    } catch (error: unknown) {
      console.error('Erreur inscription:', error);
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('already registered') || errorMessage.includes('existe déjà')) {
        setEmailError('Un compte existe déjà avec cet email');
      } else {
        setEmailError(errorMessage || 'Une erreur est survenue. Veuillez réessayer.');
      }
      setIsLoading(false);
    }
  };

  const ValidationIcon = ({ isValid }: { isValid: boolean }) => {
    if (isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-gray-300" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Titre */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Inscription Candidat</h1>
              <p className="text-gray-600 mt-2">
                Créez votre compte pour accéder aux meilleures opportunités
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse e-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={`pl-10 w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="jean.dupont@exemple.com"
                    required
                  />
                </div>
                {emailError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordTouched(true);
                    }}
                    className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Critères de validation du mot de passe */}
                {passwordTouched && (
                  <div className="mt-3 space-y-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-2">Le mot de passe doit contenir :</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <ValidationIcon isValid={passwordValidation.minLength} />
                        <span className={passwordValidation.minLength ? 'text-green-700' : 'text-gray-600'}>
                          Au moins 8 caractères
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <ValidationIcon isValid={passwordValidation.hasUpperCase} />
                        <span className={passwordValidation.hasUpperCase ? 'text-green-700' : 'text-gray-600'}>
                          Une lettre majuscule
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <ValidationIcon isValid={passwordValidation.hasLowerCase} />
                        <span className={passwordValidation.hasLowerCase ? 'text-green-700' : 'text-gray-600'}>
                          Une lettre minuscule
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <ValidationIcon isValid={passwordValidation.hasNumber} />
                        <span className={passwordValidation.hasNumber ? 'text-green-700' : 'text-gray-600'}>
                          Un chiffre
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <ValidationIcon isValid={passwordValidation.hasSpecialChar} />
                        <span className={passwordValidation.hasSpecialChar ? 'text-green-700' : 'text-gray-600'}>
                          Un caractère spécial (!@#$%^&*...)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-10 w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="h-4 w-4" />
                    <span>Les mots de passe ne correspondent pas</span>
                  </div>
                )}
                {passwordsMatch && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Les mots de passe correspondent</span>
                  </div>
                )}
              </div>

              {/* CGU */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 mt-1 text-blue-600 rounded"
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  J'accepte les{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    conditions générales d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    politique de confidentialité
                  </a>
                </label>
              </div>

              {/* Bouton submit */}
              <button
                type="submit"
                disabled={isLoading || !passwordValidation.isStrong || !passwordsMatch}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
              </button>
            </form>

            {/* Lien connexion */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link href="/login-candidate" className="text-blue-600 hover:text-blue-700 font-medium">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
