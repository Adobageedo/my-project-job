import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

export interface DeleteAccountResult {
  success: boolean;
  deletedData: {
    cvFiles: number;
    candidateCvs: number;
    applications: number;
    savedOffers: number;
    savedSearches: number;
    notificationSettings: boolean;
    applicationNotes: number;
    profile: boolean;
    authUser: boolean;
  };
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Supprime complètement un compte candidat et toutes ses données
   * Tables concernées:
   * - candidate_cvs (CVs multiples)
   * - applications (candidatures)
   * - saved_offers (offres sauvegardées)
   * - saved_searches (recherches sauvegardées)
   * - notification_settings (paramètres de notification)
   * - application_notes (notes créées par le candidat)
   * - users (profil utilisateur)
   * - auth.users (compte d'authentification)
   * - Storage bucket 'cvs' (fichiers CV)
   */
  async deleteCandidateAccount(userId: string): Promise<DeleteAccountResult> {
    this.logger.log(`Début suppression compte candidat: ${userId}`);
    
    const result: DeleteAccountResult = {
      success: false,
      deletedData: {
        cvFiles: 0,
        candidateCvs: 0,
        applications: 0,
        savedOffers: 0,
        savedSearches: 0,
        notificationSettings: false,
        applicationNotes: 0,
        profile: false,
        authUser: false,
      },
    };

    try {
      // 1. Récupérer les CVs du candidat pour supprimer les fichiers du storage
      const { data: candidateCvs } = await this.supabase.client
        .from('candidate_cvs')
        .select('storage_path')
        .eq('user_id', userId);

      if (candidateCvs && candidateCvs.length > 0) {
        const cvPaths = candidateCvs
          .filter(cv => cv.storage_path)
          .map(cv => cv.storage_path);

        if (cvPaths.length > 0) {
          const { error: storageError } = await this.supabase.client.storage
            .from('cvs')
            .remove(cvPaths);

          if (storageError) {
            this.logger.warn(`Erreur suppression fichiers CV du storage: ${storageError.message}`);
          } else {
            result.deletedData.cvFiles = cvPaths.length;
            this.logger.log(`${cvPaths.length} fichiers CV supprimés du storage`);
          }
        }
      }

      // 2. Supprimer les enregistrements candidate_cvs
      const { error: candidateCvsError, count: candidateCvsCount } = await this.supabase.client
        .from('candidate_cvs')
        .delete()
        .eq('user_id', userId);

      if (candidateCvsError) {
        this.logger.warn(`Erreur suppression candidate_cvs: ${candidateCvsError.message}`);
      } else {
        result.deletedData.candidateCvs = candidateCvsCount || 0;
        this.logger.log(`${candidateCvsCount || 0} enregistrements candidate_cvs supprimés`);
      }

      // 3. Supprimer les candidatures (applications)
      // Note: candidate_id dans applications = user_id
      const { error: applicationsError, count: applicationsCount } = await this.supabase.client
        .from('applications')
        .delete()
        .eq('candidate_id', userId);

      if (applicationsError) {
        this.logger.warn(`Erreur suppression applications: ${applicationsError.message}`);
      } else {
        result.deletedData.applications = applicationsCount || 0;
        this.logger.log(`${applicationsCount || 0} candidatures supprimées`);
      }

      // 4. Supprimer les offres sauvegardées (saved_offers)
      const { error: savedOffersError, count: savedOffersCount } = await this.supabase.client
        .from('saved_offers')
        .delete()
        .eq('user_id', userId);

      if (savedOffersError) {
        this.logger.warn(`Erreur suppression saved_offers: ${savedOffersError.message}`);
      } else {
        result.deletedData.savedOffers = savedOffersCount || 0;
        this.logger.log(`${savedOffersCount || 0} offres sauvegardées supprimées`);
      }

      // 5. Supprimer les recherches sauvegardées (saved_searches)
      const { error: savedSearchesError, count: savedSearchesCount } = await this.supabase.client
        .from('saved_searches')
        .delete()
        .eq('user_id', userId);

      if (savedSearchesError) {
        this.logger.warn(`Erreur suppression saved_searches: ${savedSearchesError.message}`);
      } else {
        result.deletedData.savedSearches = savedSearchesCount || 0;
        this.logger.log(`${savedSearchesCount || 0} recherches sauvegardées supprimées`);
      }

      // 6. Supprimer les paramètres de notification (notification_settings)
      const { error: notificationSettingsError } = await this.supabase.client
        .from('notification_settings')
        .delete()
        .eq('user_id', userId);

      if (notificationSettingsError) {
        this.logger.warn(`Erreur suppression notification_settings: ${notificationSettingsError.message}`);
      } else {
        result.deletedData.notificationSettings = true;
        this.logger.log(`Paramètres de notification supprimés`);
      }

      // 7. Supprimer les notes d'application créées par le candidat (application_notes)
      const { error: applicationNotesError, count: applicationNotesCount } = await this.supabase.client
        .from('application_notes')
        .delete()
        .eq('author_id', userId);

      if (applicationNotesError) {
        this.logger.warn(`Erreur suppression application_notes: ${applicationNotesError.message}`);
      } else {
        result.deletedData.applicationNotes = applicationNotesCount || 0;
        this.logger.log(`${applicationNotesCount || 0} notes d'application supprimées`);
      }

      // 8. Supprimer le profil utilisateur (users)
      const { error: profileError } = await this.supabase.client
        .from('users')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw new BadRequestException(`Erreur suppression profil utilisateur: ${profileError.message}`);
      }
      result.deletedData.profile = true;
      this.logger.log(`Profil utilisateur supprimé`);

      // 9. Supprimer l'utilisateur auth (nécessite service_role_key)
      const { error: authError } = await this.supabase.client.auth.admin.deleteUser(userId);

      if (authError) {
        throw new BadRequestException(`Erreur suppression compte auth: ${authError.message}`);
      }
      result.deletedData.authUser = true;
      this.logger.log(`Utilisateur auth supprimé`);

      result.success = true;
      this.logger.log(`Compte candidat ${userId} supprimé avec succès`);

      return result;
    } catch (error) {
      this.logger.error(`Erreur suppression compte: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Supprime complètement un compte entreprise et toutes ses données
   */
  async deleteCompanyAccount(userId: string): Promise<DeleteAccountResult> {
    this.logger.log(`Début suppression compte entreprise: ${userId}`);
    
    const result: DeleteAccountResult = {
      success: false,
      deletedData: {
        cvFiles: 0,
        candidateCvs: 0,
        applications: 0,
        savedOffers: 0,
        savedSearches: 0,
        notificationSettings: false,
        applicationNotes: 0,
        profile: false,
        authUser: false,
      },
    };

    try {
      // 1. Récupérer le profil entreprise via l'utilisateur
      const { data: user, error: userError } = await this.supabase.client
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw new BadRequestException(`Erreur récupération utilisateur: ${userError.message}`);
      }

      if (user?.company_id) {
        const companyId = user.company_id;

        // 2. Supprimer les offres d'emploi
        const { error: offersError } = await this.supabase.client
          .from('job_offers')
          .delete()
          .eq('company_id', companyId);

        if (offersError) {
          this.logger.warn(`Erreur suppression offres: ${offersError.message}`);
        } else {
          this.logger.log(`Offres supprimées`);
        }

        // 3. Supprimer le profil entreprise (si l'utilisateur est le contact principal)
        const { error: profileError } = await this.supabase.client
          .from('companies')
          .delete()
          .eq('id', companyId);

        if (profileError) {
          this.logger.warn(`Erreur suppression profil entreprise: ${profileError.message}`);
        } else {
          result.deletedData.profile = true;
          this.logger.log(`Profil entreprise supprimé`);
        }
      }

      // 4. Supprimer les paramètres de notification
      const { error: notificationSettingsError } = await this.supabase.client
        .from('notification_settings')
        .delete()
        .eq('user_id', userId);

      if (notificationSettingsError) {
        this.logger.warn(`Erreur suppression notification_settings: ${notificationSettingsError.message}`);
      } else {
        result.deletedData.notificationSettings = true;
      }

      // 5. Supprimer le profil utilisateur
      const { error: userProfileError } = await this.supabase.client
        .from('users')
        .delete()
        .eq('id', userId);

      if (userProfileError) {
        throw new BadRequestException(`Erreur suppression profil utilisateur: ${userProfileError.message}`);
      }
      this.logger.log(`Profil utilisateur supprimé`);

      // 6. Supprimer l'utilisateur auth
      const { error: authError } = await this.supabase.client.auth.admin.deleteUser(userId);

      if (authError) {
        throw new BadRequestException(`Erreur suppression compte auth: ${authError.message}`);
      }
      result.deletedData.authUser = true;
      this.logger.log(`Utilisateur auth supprimé`);

      result.success = true;
      this.logger.log(`Compte entreprise ${userId} supprimé avec succès`);

      return result;
    } catch (error) {
      this.logger.error(`Erreur suppression compte: ${error.message}`, error.stack);
      throw error;
    }
  }
}
