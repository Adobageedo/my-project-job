import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SupabaseService } from '../../common/supabase/supabase.service';

interface SendEmailParams {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, unknown>;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email service disabled.');
      return;
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL') || 'noreply@financestages.fr';
    this.fromName = this.config.get<string>('RESEND_FROM_NAME') || 'FinanceStages';
  }

  /**
   * Envoyer un email via Resend
   */
  async send(params: SendEmailParams): Promise<{ id: string }> {
    if (!this.resend) {
      throw new Error('Email service not configured');
    }

    const { to, subject, templateName, templateData, from } = params;

    this.logger.log(`Sending email to ${to}: ${subject}`);

    try {
      const html = this.renderTemplate(templateName, templateData || {});

      const result = await this.resend.emails.send({
        from: from || `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
      });

      const messageId = (result as any).id || (result.data as any)?.id || 'unknown';

      // Logger dans Supabase
      await this.logEmail({
        recipient: to,
        subject,
        templateName,
        status: 'sent',
        resendMessageId: messageId,
      });

      return { id: messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error);

      // Logger l'erreur
      await this.logEmail({
        recipient: to,
        subject,
        templateName,
        status: 'failed',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Notification nouvelle candidature (pour l'entreprise)
   */
  async notifyNewApplication(params: {
    companyEmail: string;
    companyName: string;
    candidateName: string;
    offerTitle: string;
    applicationId: string;
  }) {
    return this.send({
      to: params.companyEmail,
      subject: `Nouvelle candidature pour ${params.offerTitle}`,
      templateName: 'new-application',
      templateData: params,
    });
  }

  /**
   * Notification nouvelle offre (pour les candidats qui suivent)
   */
  async notifyNewOffer(params: {
    candidateEmail: string;
    candidateName: string;
    companyName: string;
    offerTitle: string;
    offerId: string;
  }) {
    return this.send({
      to: params.candidateEmail,
      subject: `Nouvelle offre: ${params.offerTitle}`,
      templateName: 'new-offer',
      templateData: params,
    });
  }

  /**
   * Notification changement de statut de candidature
   */
  async notifyApplicationStatusChange(params: {
    candidateEmail: string;
    candidateName: string;
    offerTitle: string;
    newStatus: string;
    applicationId: string;
  }) {
    const statusLabels: Record<string, string> = {
      pending: 'en attente',
      reviewing: 'en cours de révision',
      shortlisted: 'présélectionnée',
      interview: 'convoqué en entretien',
      accepted: 'acceptée',
      rejected: 'refusée',
    };

    return this.send({
      to: params.candidateEmail,
      subject: `Mise à jour de votre candidature: ${params.offerTitle}`,
      templateName: 'application-status-change',
      templateData: {
        ...params,
        statusLabel: statusLabels[params.newStatus] || params.newStatus,
      },
    });
  }

  /**
   * Email de bienvenue
   */
  async sendWelcomeEmail(params: {
    email: string;
    firstName: string;
    userType: 'candidate' | 'company';
  }) {
    const templates = {
      candidate: 'welcome-candidate',
      company: 'welcome-company',
    };

    return this.send({
      to: params.email,
      subject: 'Bienvenue sur FinanceStages !',
      templateName: templates[params.userType],
      templateData: params,
    });
  }

  /**
   * Logger un email dans Supabase
   */
  private async logEmail(params: {
    recipient: string;
    subject: string;
    templateName: string;
    status: 'sent' | 'failed' | 'delivered' | 'bounced';
    resendMessageId?: string;
    errorMessage?: string;
  }) {
    try {
      await this.supabase.client.from('email_logs').insert({
        recipient: params.recipient,
        subject: params.subject,
        template_name: params.templateName,
        status: params.status,
        resend_message_id: params.resendMessageId,
        error_message: params.errorMessage,
      });
    } catch (error: any) {
      this.logger.error(`Failed to log email: ${error.message}`);
    }
  }

  /**
   * Rendre un template email (HTML simple)
   */
  private renderTemplate(templateName: string, data: Record<string, unknown>): string {
    const templates: Record<string, (data: any) => string> = {
      'new-application': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nouvelle candidature reçue</h2>
          <p>Bonjour ${d.companyName},</p>
          <p><strong>${d.candidateName}</strong> a postulé à votre offre <strong>${d.offerTitle}</strong>.</p>
          <p><a href="https://financestages.fr/company/applications/${d.applicationId}" 
             style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Voir la candidature
          </a></p>
        </div>
      `,
      
      'new-offer': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nouvelle offre disponible</h2>
          <p>Bonjour ${d.candidateName},</p>
          <p>Une nouvelle offre correspond à votre profil :</p>
          <h3>${d.offerTitle}</h3>
          <p><strong>Entreprise:</strong> ${d.companyName}</p>
          <p><a href="https://financestages.fr/candidate/offers/${d.offerId}"
             style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Voir l'offre
          </a></p>
        </div>
      `,

      'application-status-change': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Mise à jour de votre candidature</h2>
          <p>Bonjour ${d.candidateName},</p>
          <p>Le statut de votre candidature pour <strong>${d.offerTitle}</strong> a été mis à jour.</p>
          <p><strong>Nouveau statut:</strong> <span style="color: #0066cc;">${d.statusLabel}</span></p>
          <p><a href="https://financestages.fr/candidate/applications/${d.applicationId}"
             style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Voir les détails
          </a></p>
        </div>
      `,

      'welcome-candidate': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenue sur FinanceStages !</h2>
          <p>Bonjour ${d.firstName},</p>
          <p>Bienvenue sur la plateforme FinanceStages ! Vous pouvez maintenant :</p>
          <ul>
            <li>Parcourir les offres de stage et d'alternance</li>
            <li>Postuler en un clic avec votre CV</li>
            <li>Suivre vos candidatures en temps réel</li>
          </ul>
          <p><a href="https://financestages.fr/candidate/dashboard"
             style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Accéder à mon espace
          </a></p>
        </div>
      `,

      'welcome-company': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenue sur FinanceStages !</h2>
          <p>Bonjour ${d.firstName},</p>
          <p>Bienvenue sur la plateforme FinanceStages ! Vous pouvez maintenant :</p>
          <ul>
            <li>Publier vos offres de stage et d'alternance</li>
            <li>Accéder à la CVthèque</li>
            <li>Gérer vos candidatures avec un Kanban</li>
          </ul>
          <p><a href="https://financestages.fr/company/dashboard"
             style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Accéder à mon espace
          </a></p>
        </div>
      `,
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    return template(data);
  }
}
