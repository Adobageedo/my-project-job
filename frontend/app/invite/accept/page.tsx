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
  Shield,
  Briefcase,
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

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'confirm' | 'processing' | 'success' | 'error'>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token d\'invitation manquant');
      setStep('error');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Rediriger vers la page de connexion avec le token
        router.push(`/login-company?redirect=/invite/accept?token=${token}`);
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
      setStep('confirm');
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur lors du chargement');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    setProcessing(true);
    setStep('processing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      // 1. Mettre à jour le profil utilisateur pour rejoindre l'entreprise
      const { error: updateError } = await supabase
        .from('users')
        .update({
          company_id: invitation.company_id,
          company_roles: [invitation.role],
          role: 'company',
          is_company_owner: false,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Créer les permissions
      await supabase.from('user_permissions').upsert({
        user_id: user.id,
        company_id: invitation.company_id,
        permissions: invitation.permissions,
        offer_ids: invitation.offer_ids,
      });

      // 3. Marquer l'invitation comme acceptée
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
      console.error('Accept error:', err);
      setError((err as Error).message || 'Erreur lors de l\'acceptation');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;
    if (!confirm('Êtes-vous sûr de vouloir refuser cette invitation ?')) return;

    try {
      await supabase
        .from('company_invitations')
        .update({
          status: 'revoked',
        })
        .eq('id', invitation.id);

      router.push('/');
    } catch (err) {
      console.error('Decline error:', err);
    }
  };

  if (loading || step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de l'invitation...</p>
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
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Traitement en cours...</p>
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
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Bienvenue dans l'équipe !</h2>
            <p className="text-gray-600 mb-4">
              Vous avez rejoint {invitation?.company.name}
            </p>
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Redirection...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Étape de confirmation
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
          {/* Logo entreprise */}
          <div className="text-center mb-6">
            {invitation?.company.logo_url ? (
              <img 
                src={invitation.company.logo_url} 
                alt={invitation.company.name}
                className="h-16 w-16 object-contain mx-auto mb-4"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              Rejoindre {invitation?.company.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Vous avez été invité à rejoindre cette entreprise
            </p>
          </div>

          {/* Détails de l'invitation */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Vos accès
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-400" />
                Rôle : <strong>{invitation?.role === 'rh' ? 'Ressources Humaines' : 'Manager'}</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                {invitation?.offer_ids && invitation.offer_ids.length > 0
                  ? `Accès à ${invitation.offer_ids.length} offre(s) sélectionnée(s)`
                  : 'Accès à toutes les offres'
                }
              </li>
              {(invitation?.permissions as any)?.can_view_applications && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Voir les candidatures
                </li>
              )}
              {(invitation?.permissions as any)?.can_edit_applications && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Modifier les candidatures
                </li>
              )}
              {(invitation?.permissions as any)?.can_send_emails && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Envoyer des emails aux candidats
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Refuser
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Accepter
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
