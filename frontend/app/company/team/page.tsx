'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { InviteManagerModal } from '@/components/company/InviteManagerModal';
import { getCurrentCompany, Company } from '@/services/companyService';
import { getCurrentUser } from '@/services/authService';
import {
  getCompanyInvitations,
  getCompanyMembers,
  cancelInvitation,
  removeMember,
  CompanyMember,
  Invitation,
} from '@/services/teamService';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  Crown,
  Briefcase,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  company: { label: 'Direction', color: 'text-purple-700', bg: 'bg-purple-100' },
  rh: { label: 'RH', color: 'text-blue-700', bg: 'bg-blue-100' },
  manager: { label: 'Manager', color: 'text-green-700', bg: 'bg-green-100' },
};

const INVITATION_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'text-amber-600', icon: <Clock className="h-4 w-4" /> },
  accepted: { label: 'Acceptée', color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" /> },
  expired: { label: 'Expirée', color: 'text-gray-500', icon: <XCircle className="h-4 w-4" /> },
  cancelled: { label: 'Annulée', color: 'text-red-600', icon: <XCircle className="h-4 w-4" /> },
};

export default function CompanyTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [companyData, userData] = await Promise.all([
        getCurrentCompany(),
        getCurrentUser(),
      ]);

      if (!companyData) {
        router.push('/login-company');
        return;
      }

      setCompany(companyData);
      setCurrentUserId(userData?.id || null);
      // Vérifier si l'utilisateur est owner via les membres
      const membersData = await getCompanyMembers(companyData.id);
      const currentMember = membersData.find(m => m.id === userData?.id);
      setIsOwner(currentMember?.is_company_owner || false);

      // Charger les invitations
      const invitationsData = await getCompanyInvitations(companyData.id);

      setMembers(membersData);
      setInvitations(invitationsData.filter((inv: Invitation) => inv.status === 'pending'));
    } catch (err) {
      console.error('Error loading team data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    const result = await cancelInvitation(invitationId);
    if (result.success) {
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } else {
      setError(result.error || 'Erreur lors de l\'annulation');
    }
    setActiveMenu(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return;
    if (!company) return;
    
    const result = await removeMember(memberId, company.id);
    if (result.success) {
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } else {
      setError(result.error || 'Erreur lors de la suppression');
    }
    setActiveMenu(null);
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestion de l'équipe</h1>
              <p className="text-gray-600">
                Gérez les membres de votre équipe et leurs permissions
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <UserPlus className="h-5 w-5" />
                Inviter un collaborateur
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Invitations en attente */}
          {invitations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Invitations en attente ({invitations.length})
              </h2>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between bg-white rounded-lg p-4 border border-amber-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.email}</p>
                        <p className="text-sm text-gray-500">
                          Invité le {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: fr })}
                          {' • '}
                          <span className={ROLE_LABELS[invitation.role]?.color || 'text-gray-600'}>
                            {ROLE_LABELS[invitation.role]?.label || invitation.role}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste des membres */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                Membres de l'équipe ({members.length})
              </h2>
            </div>

            {members.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun membre dans l'équipe</p>
                {isOwner && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Inviter votre premier collaborateur
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {members.map((member) => {
                  const roleInfo = ROLE_LABELS[member.company_roles?.[0] || 'manager'];
                  const isCurrentUser = member.id === currentUserId;

                  return (
                    <div
                      key={member.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={`${member.first_name} ${member.last_name}`}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </p>
                            {member.is_company_owner && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                <Crown className="h-3 w-3" />
                                Référent
                              </span>
                            )}
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                Vous
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Rôles */}
                        <div className="flex items-center gap-2">
                          {(member.company_roles || []).map((role: string) => {
                            const info = ROLE_LABELS[role];
                            return (
                              <span
                                key={role}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${info?.bg || 'bg-gray-100'} ${info?.color || 'text-gray-700'}`}
                              >
                                {info?.label || role}
                              </span>
                            );
                          })}
                        </div>

                        {/* Permissions info */}
                        {member.permissions && (
                          <div className="flex items-center gap-1 text-gray-400">
                            {member.permissions.can_view_applications && (
                              <span title="Peut voir les candidatures"><Eye className="h-4 w-4" /></span>
                            )}
                            {member.permissions.can_change_status && (
                              <span title="Peut changer les statuts"><Edit className="h-4 w-4" /></span>
                            )}
                            {member.offer_ids && member.offer_ids.length > 0 && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                {member.offer_ids.length} offre{member.offer_ids.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Menu actions */}
                        {isOwner && !member.is_company_owner && (
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <MoreVertical className="h-5 w-5 text-gray-500" />
                            </button>

                            {activeMenu === member.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActiveMenu(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                  <button
                                    onClick={() => {
                                      // TODO: Ouvrir modal d'édition des permissions
                                      setActiveMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Shield className="h-4 w-4" />
                                    Modifier les permissions
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Retirer de l'équipe
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info permissions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              À propos des permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ROLE_LABELS.company.bg} ${ROLE_LABELS.company.color} mb-2`}>
                  {ROLE_LABELS.company.label}
                </div>
                <p className="text-gray-600">
                  Accès complet : gestion des offres, candidatures, équipe et paramètres entreprise.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ROLE_LABELS.rh.bg} ${ROLE_LABELS.rh.color} mb-2`}>
                  {ROLE_LABELS.rh.label}
                </div>
                <p className="text-gray-600">
                  Gestion du recrutement : création d'offres, suivi des candidatures, communication candidats.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ROLE_LABELS.manager.bg} ${ROLE_LABELS.manager.color} mb-2`}>
                  {ROLE_LABELS.manager.label}
                </div>
                <p className="text-gray-600">
                  Accès limité : consultation et suivi des candidatures sur les offres assignées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'invitation */}
      {company && currentUserId && (
        <InviteManagerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          companyId={company.id}
          invitedBy={currentUserId}
          onSuccess={loadData}
        />
      )}

      <Footer />
    </div>
  );
}
