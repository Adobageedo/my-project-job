import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { EmailService } from '../email/email.service';

interface InviteManagerParams {
  email: string;
  companyId: string;
  invitedBy: string;
  role: 'manager' | 'rh';
  permissions: Record<string, unknown>;
  offerIds?: string[];
}

interface ExistingUserInviteResult {
  isExistingUser: boolean;
  userId?: string;
}

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);
  private frontendUrl: string;

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
    private emailService: EmailService,
  ) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Inviter un manager à rejoindre l'entreprise
   * Gère deux cas :
   * 1. Nouvel utilisateur : envoie un magic link via Supabase
   * 2. Utilisateur existant : envoie un email via Resend et ajoute directement à l'équipe
   */
  async inviteManager(
    params: InviteManagerParams,
    requestingUserId: string,
  ): Promise<{ success: boolean; error?: string; isExistingUser?: boolean }> {
    const { email, companyId, invitedBy, role, permissions, offerIds } = params;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Vérifier que l'utilisateur qui invite appartient bien à cette entreprise
      const { data: inviter, error: inviterError } = await this.supabase.client
        .from('users')
        .select('id, company_id, is_company_owner, is_primary_company_contact, company_roles, first_name, last_name')
        .eq('id', requestingUserId)
        .single();

      if (inviterError || !inviter) {
        throw new ForbiddenException('Utilisateur non trouvé');
      }

      if (inviter.company_id !== companyId) {
        throw new ForbiddenException('Vous ne pouvez inviter que pour votre propre entreprise');
      }

      // Vérifier les droits d'invitation
      if (!inviter.is_company_owner && !inviter.is_primary_company_contact) {
        throw new ForbiddenException('Vous n\'avez pas les droits pour inviter des membres');
      }

      // 2. Vérifier si l'utilisateur existe déjà (sur la plateforme)
      const { data: existingUser } = await this.supabase.client
        .from('users')
        .select('id, company_id, email, first_name, role')
        .eq('email', normalizedEmail)
        .single();

      // Si l'utilisateur est déjà dans cette entreprise
      if (existingUser?.company_id === companyId) {
        throw new BadRequestException('Cet utilisateur fait déjà partie de l\'équipe');
      }

      // 3. Récupérer le nom de l'entreprise
      const { data: company } = await this.supabase.client
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      const companyName = company?.name || 'Entreprise';
      const inviterName = [inviter.first_name, inviter.last_name].filter(Boolean).join(' ') || 'Un membre';

      // 4. CAS 1: Utilisateur existant sur la plateforme (mais pas dans cette entreprise)
      if (existingUser && existingUser.id) {
        return await this.handleExistingUserInvite({
          existingUser,
          companyId,
          companyName,
          invitedBy,
          inviterName,
          role,
          permissions,
          offerIds,
        });
      }

      // 5. CAS 2: Nouvel utilisateur - envoyer magic link
      return await this.handleNewUserInvite({
        email: normalizedEmail,
        companyId,
        companyName,
        invitedBy,
        role,
        permissions,
        offerIds,
      });

    } catch (error: any) {
      this.logger.error('Invite manager error:', error);
      return { 
        success: false, 
        error: error.message || 'Erreur lors de l\'envoi de l\'invitation' 
      };
    }
  }

  /**
   * Gérer l'invitation d'un utilisateur déjà inscrit sur la plateforme
   */
  private async handleExistingUserInvite(params: {
    existingUser: { id: string; company_id: string | null; email: string; first_name: string | null; role: string };
    companyId: string;
    companyName: string;
    invitedBy: string;
    inviterName: string;
    role: string;
    permissions: Record<string, unknown>;
    offerIds?: string[];
  }): Promise<{ success: boolean; error?: string; isExistingUser: boolean }> {
    const { existingUser, companyId, companyName, invitedBy, inviterName, role, permissions, offerIds } = params;

    try {
      // Vérifier si une invitation pending existe
      const { data: existingInvite } = await this.supabase.client
        .from('company_invitations')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', existingUser.email)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new BadRequestException('Une invitation est déjà en attente pour cet email');
      }

      // Générer un token pour l'acceptation
      const token = this.generateToken();

      // Créer l'invitation
      const { error: inviteError } = await this.supabase.client
        .from('company_invitations')
        .insert({
          company_id: companyId,
          invited_by: invitedBy,
          email: existingUser.email,
          role,
          permissions,
          offer_ids: offerIds || null,
          token,
          status: 'pending',
          user_id: existingUser.id, // Lier à l'utilisateur existant
        });

      if (inviteError) {
        this.logger.error('Failed to create invitation for existing user', inviteError);
        throw new Error('Erreur lors de la création de l\'invitation');
      }

      // Construire le message sur les accès
      const accessDescription = offerIds && offerIds.length > 0
        ? `aux offres sélectionnées (${offerIds.length} offre${offerIds.length > 1 ? 's' : ''})`
        : 'à toutes les offres de l\'entreprise';

      // Envoyer l'email via Resend
      const dashboardUrl = `${this.frontendUrl}/company/dashboard`;
      const acceptUrl = `${this.frontendUrl}/invite/accept?token=${token}`;

      await this.emailService.sendRawEmail({
        to: existingUser.email,
        subject: `Invitation à rejoindre ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Bonjour ${existingUser.first_name || ''},</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              <strong>${inviterName}</strong> vous invite à rejoindre l'équipe de <strong>${companyName}</strong> 
              sur notre plateforme.
            </p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Vos accès :</h3>
              <ul style="color: #475569; margin: 0; padding-left: 20px;">
                <li>Rôle : <strong>${role === 'rh' ? 'Ressources Humaines' : 'Manager'}</strong></li>
                <li>Accès ${accessDescription}</li>
                ${(permissions as any).can_view_applications ? '<li>✓ Voir les candidatures</li>' : ''}
                ${(permissions as any).can_edit_applications ? '<li>✓ Modifier les candidatures</li>' : ''}
                ${(permissions as any).can_send_emails ? '<li>✓ Envoyer des emails aux candidats</li>' : ''}
                ${(permissions as any).can_change_status ? '<li>✓ Changer le statut des candidatures</li>' : ''}
              </ul>
            </div>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Comme vous avez déjà un compte sur notre plateforme, il vous suffit d'accepter cette invitation 
              pour accéder au tableau de bord de l'entreprise.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${acceptUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; 
                        border-radius: 8px; text-decoration: none; font-weight: 600;">
                Accepter l'invitation
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px;">
              Ou copiez ce lien dans votre navigateur :<br>
              <a href="${acceptUrl}" style="color: #2563eb;">${acceptUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
            
            <p style="color: #94a3b8; font-size: 12px;">
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
            </p>
          </div>
        `,
      });

      this.logger.log(`Invitation email sent to existing user ${existingUser.email} for company ${companyId}`);
      return { success: true, isExistingUser: true };

    } catch (error: any) {
      this.logger.error('Handle existing user invite error:', error);
      throw error;
    }
  }

  /**
   * Gérer l'invitation d'un nouvel utilisateur
   */
  private async handleNewUserInvite(params: {
    email: string;
    companyId: string;
    companyName: string;
    invitedBy: string;
    role: string;
    permissions: Record<string, unknown>;
    offerIds?: string[];
  }): Promise<{ success: boolean; error?: string; isExistingUser: boolean }> {
    const { email, companyId, companyName, invitedBy, role, permissions, offerIds } = params;

    try {
      // Vérifier si une invitation pending existe
      const { data: existingInvite } = await this.supabase.client
        .from('company_invitations')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new BadRequestException('Une invitation est déjà en attente pour cet email');
      }

      // Générer un token unique
      const token = this.generateToken();

      // Créer l'invitation
      const { data: invitation, error: inviteError } = await this.supabase.client
        .from('company_invitations')
        .insert({
          company_id: companyId,
          invited_by: invitedBy,
          email,
          role,
          permissions,
          offer_ids: offerIds || null,
          token,
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) {
        this.logger.error('Failed to create invitation', inviteError);
        throw new Error('Erreur lors de la création de l\'invitation');
      }

      // Envoyer le magic link via Supabase Admin API
      const redirectUrl = `${this.frontendUrl}/invite/setup?token=${token}`;

      const { error: otpError } = await this.supabase.adminClient.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: redirectUrl,
          data: {
            invited_to_company: companyId,
            company_name: companyName,
            invitation_token: token,
            role: role,
          },
        },
      );

      if (otpError) {
        // Rollback invitation if email fails
        await this.supabase.client
          .from('company_invitations')
          .delete()
          .eq('id', invitation.id);
        
        this.logger.error('Failed to send invite email', otpError);
        throw new Error(`Erreur d'envoi de l'invitation: ${otpError.message}`);
      }

      this.logger.log(`Invitation sent to new user ${email} for company ${companyId}`);
      return { success: true, isExistingUser: false };

    } catch (error: any) {
      this.logger.error('Handle new user invite error:', error);
      throw error;
    }
  }

  /**
   * Générer un token unique pour l'invitation
   */
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
