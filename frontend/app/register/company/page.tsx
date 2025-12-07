'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Building2, Mail, Lock, Phone, User, Briefcase, Users, CheckSquare, AlertCircle, Loader2 } from 'lucide-react';
import { registerCompany } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

type CompanyRole = 'company' | 'rh' | 'manager';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const { setUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    siret: '',
    sector: '',
    size: '1000-5000',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    password: '',
    confirmPassword: '',
    roles: ['company'] as CompanyRole[],
  });

  const handleRoleToggle = (role: CompanyRole) => {
    const currentRoles = formData.roles;
    if (currentRoles.includes(role)) {
      // Ne pas permettre de désélectionner si c'est le dernier rôle
      if (currentRoles.length === 1) return;
      setFormData({
        ...formData,
        roles: currentRoles.filter(r => r !== role),
      });
    } else {
      setFormData({
        ...formData,
        roles: [...currentRoles, role],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.roles.length === 0) {
      setError('Veuillez sélectionner au moins un rôle');
      return;
    }

    setIsLoading(true);

    try {
      // Utiliser le service d'authentification
      await registerCompany(formData.contactEmail, formData.password, {
        companyName: formData.companyName,
        siret: formData.siret,
        sector: formData.sector,
        size: formData.size,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        roles: formData.roles,
      });

      // Enregistrer le rôle dans le contexte
      setUserRole('company');

      // Rediriger vers une page de confirmation d'email
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.contactEmail)}`);

    } catch (err: unknown) {
      console.error('Erreur inscription:', err);
      setError((err as Error).message || 'Une erreur est survenue lors de l\'inscription');
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
        <div className="max-w-2xl mx-auto">
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

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations entreprise */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Informations de l'entreprise
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'entreprise *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="BNP Paribas"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de SIRET *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="siret"
                        name="siret"
                        type="text"
                        value={formData.siret}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12345678901234"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                        Secteur d'activité *
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="sector"
                          name="sector"
                          type="text"
                          value={formData.sector}
                          onChange={handleChange}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Banque d'investissement"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                        Taille de l'entreprise *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          id="size"
                          name="size"
                          value={formData.size}
                          onChange={handleChange}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
                </div>
              </div>

              {/* Sélection des rôles */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Vos rôles dans l'entreprise *
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Sélectionnez un ou plusieurs rôles (combinables)
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('company')}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${formData.roles.includes('company')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 hover:border-slate-400'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <CheckSquare
                        className={`w-5 h-5 flex-shrink-0 ${
                          formData.roles.includes('company') ? 'text-blue-500' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-slate-900">Entreprise</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Gestion globale et publication d'offres
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleToggle('rh')}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${formData.roles.includes('rh')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 hover:border-slate-400'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <CheckSquare
                        className={`w-5 h-5 flex-shrink-0 ${
                          formData.roles.includes('rh') ? 'text-blue-500' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-slate-900">RH</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Gestion des candidatures et recrutement
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleToggle('manager')}
                    className={`
                      p-4 rounded-lg border-2 transition-all text-left
                      ${formData.roles.includes('manager')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 hover:border-slate-400'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <CheckSquare
                        className={`w-5 h-5 flex-shrink-0 ${
                          formData.roles.includes('manager') ? 'text-blue-500' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-slate-900">Manager</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Supervision et validation des candidatures
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {formData.roles.length > 1 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Rôles sélectionnés :</strong> {formData.roles.map(r => 
                        r === 'company' ? 'Entreprise' : r === 'rh' ? 'RH' : 'Manager'
                      ).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Contact principal */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Interlocuteur principal
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom et prénom *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="contactName"
                        name="contactName"
                        type="text"
                        value={formData.contactName}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Marie Dupont"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email professionnel *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="contactEmail"
                          name="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={handleChange}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="marie.dupont@entreprise.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+33 1 23 45 67 89"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Sécurité
                </h3>
                
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
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>
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
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      </div>

      <Footer />
    </div>
  );
}
