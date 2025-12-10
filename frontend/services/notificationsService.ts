/**
 * Service des notifications
 * Gère les paramètres de notifications et l'envoi d'emails via Backend Railway
 */

import { NotificationSettings } from '@/types';
import { supabase } from './supabase/client';
import { API_CONFIG } from './api/config';

/**
 * Récupérer les paramètres de notification d'un utilisateur
 */
export const getNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Si pas de settings, retourner les valeurs par défaut
    if (error.code === 'PGRST116') {
      return {
        userId,
        emailMatchingOffers: true,
        emailApplicationUpdates: true,
      };
    }
    throw new Error(error.message);
  }

  return {
    userId: data.user_id,
    emailMatchingOffers: data.email_matching_offers ?? true,
    emailApplicationUpdates: data.email_application_updates ?? true,
  };
};

/**
 * Mettre à jour les paramètres de notification
 */
export const updateNotificationSettings = async (
  userId: string,
  settings: Partial<Omit<NotificationSettings, 'userId'>>
): Promise<NotificationSettings> => {
  const updatePayload: Record<string, any> = { user_id: userId };

  if (settings.emailMatchingOffers !== undefined) {
    updatePayload.email_matching_offers = settings.emailMatchingOffers;
  }
  if (settings.emailApplicationUpdates !== undefined) {
    updatePayload.email_application_updates = settings.emailApplicationUpdates;
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(updatePayload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: data.user_id,
    emailMatchingOffers: data.email_matching_offers ?? true,
    emailApplicationUpdates: data.email_application_updates ?? true,
  };
};

/**
 * Envoyer un email via Backend Railway
 */
export const sendEmail = async (data: {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, unknown>;
}): Promise<{ success: boolean; messageId?: string }> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentification requise');
  }

  const response = await fetch(`${API_CONFIG.BACKEND_URL}/v1/email/${data.templateName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(data.templateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }

  const result = await response.json();
  return { success: true, messageId: result.id };
};

/**
 * Notifier d'une nouvelle candidature (Backend Railway)
 */
export const notifyNewApplication = async (params: {
  companyEmail: string;
  companyName: string;
  candidateName: string;
  offerTitle: string;
  applicationId: string;
}) => {
  return sendEmail({
    to: params.companyEmail,
    subject: `Nouvelle candidature pour ${params.offerTitle}`,
    templateName: 'notify/application',
    templateData: params,
  });
};

/**
 * Notifier d'une nouvelle offre (Backend Railway)
 */
export const notifyNewOffer = async (params: {
  candidateEmail: string;
  candidateName: string;
  companyName: string;
  offerTitle: string;
  offerId: string;
}) => {
  return sendEmail({
    to: params.candidateEmail,
    subject: `Nouvelle offre: ${params.offerTitle}`,
    templateName: 'notify/offer',
    templateData: params,
  });
};

/**
 * Notifier d'un changement de statut de candidature (Backend Railway)
 */
export const notifyApplicationStatusChange = async (params: {
  candidateEmail: string;
  candidateName: string;
  offerTitle: string;
  newStatus: string;
  applicationId: string;
}) => {
  return sendEmail({
    to: params.candidateEmail,
    subject: `Mise à jour de votre candidature: ${params.offerTitle}`,
    templateName: 'notify/status-change',
    templateData: params,
  });
};
