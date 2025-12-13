'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Building2,
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

interface InvitationData {
  id: string;
  company_id: string;
  email: string;
  role: string;
  permissions: Record<string, unknown>;
  offer_ids: string[] | null;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export default function InviteSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'setup' | 'saving' | 'success' | 'error'>('loading');
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token d\'invitation manquant');
      setStep('error');
      setLoading(false);
      return;
    }

    checkAuthAndLoadInvitation();
  }, [token]);

  const checkAuthAndLoadInvitation = async () => {
    try {
      // Vérifier si l'utilisateur est connecté (via magic link)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Pas encore connecté, attendre le callback du magic link
        setError('Veuillez cliquer sur le lien dans votre email pour continuer');
        setStep('error');
        return;
      }

      // Charger l'invitation
      const { data: inviteData, error: inviteError } = await supabase
        .from('company_invitations')
        .select(`
          id,
          company_id,
          email,
          role,
          permissions,
          offer_ids,
          status,
          company:companies(id, name, logo_url)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !inviteData) {
        setError('Invitation non trouvée ou déjà utilisée');
        setStep('error');
        return;
      }

      // Vérifier que l'email correspond
      if (user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
        setError('Cette invitation est destinée à une autre adresse email');
        setStep('error');
        return;
      }

      const invitation: InvitationData = {
        ...inviteData,
        company: Array.isArray(inviteData.company) ? inviteData.company[0] : inviteData.company,
      };

      setInvitation(invitation);
      
      // Pré-remplir avec les métadonnées si disponibles
      const metadata = user.user_metadata;
      if (metadata?.first_name) setFirstName(metadata.first_name);
      if (metadata?.last_name) setLastName(metadata.last_name);
      
      setStep('setup');
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors du chargement');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!invitation) return;

    setSaving(true);
    setError(null);
    setStep('saving');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // 1. Mettre à jour le mot de passe
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (passwordError) throw passwordError;

      // 2. Créer ou mettre à jour le profil utilisateur
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingUser) {
        // Mettre à jour l'utilisateur existant
        await supabase
          .from('users')
          .update({
            company_id: invitation.company_id,
            company_roles: [invitation.role],
            first_name: firstName,
            last_name: lastName,
            role: 'company',
            onboarding_completed: true, // Pas besoin d'onboarding, l'entreprise existe déjà
          })
          .eq('id', user.id);
      } else {
        // Créer le profil utilisateur
        await supabase.from('users').insert({
          id: user.id,
          email: user.email?.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          role: 'company',
          company_id: invitation.company_id,
          company_roles: [invitation.role],
          is_company_owner: false,
          onboarding_completed: true, // Pas besoin d'onboarding, l'entreprise existe déjà
        });
      }

      // 3. Créer les permissions
      await supabase.from('user_permissions').upsert({
        user_id: user.id,
        company_id: invitation.company_id,
        permissions: invitation.permissions,
        offer_ids: invitation.offer_ids,
      });

      // 4. Marquer l'invitation comme acceptée
      await supabase
        .from('company_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      setStep('success');

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/company/dashboard');
      }, 2000);
    } catch (err: unknown) {
      console.error('Setup error:', err);
      setError((err as Error).message || 'Erreur lors de la configuration');
      setStep('setup');
    } finally {
      setSaving(false);
    }
  };

  if (loading || step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 'saving') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Configuration de votre compte...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
            <p className="text-gray-600 mb-6">
              Vous avez rejoint <strong>{invitation?.company.name}</strong>. 
              Redirection vers votre tableau de bord...
            </p>
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Setup form
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          {/* Company info */}
          <div className="text-center mb-8">
            {invitation?.company.logo_url ? (
              <img 
                src={invitation.company.logo_url} 
                alt={invitation.company.name}
                className="h-16 w-16 rounded-xl object-cover mx-auto mb-4"
              />
            ) : (
              <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Configurez votre compte
            </h1>
            <p className="text-gray-600">
              Finalisez votre inscription pour rejoindre <strong>{invitation?.company.name}</strong>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirmez votre mot de passe"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Configuration...
                </>
              ) : (
                'Finaliser mon inscription'
              )}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
