import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

export interface DeleteAccountResult {
  success: boolean;
  deletedData: {
    cvFiles: number;
    savedCvs: number;
    applications: number;
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
   */
  async deleteCandidateAccount(userId: string): Promise<DeleteAccountResult> {
    this.logger.log(`Début suppression compte candidat: ${userId}`);
    
    const result: DeleteAccountResult = {
      success: false,
      deletedData: {
        cvFiles: 0,
        savedCvs: 0,
        applications: 0,
        profile: false,
        authUser: false,
      },
    };

    try {
      // 1. Récupérer le profil candidat
      const { data: candidate, error: candidateError } = await this.supabase.client
        .from('candidates')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (candidateError && candidateError.code !== 'PGRST116') {
        throw new BadRequestException(`Erreur récupération profil: ${candidateError.message}`);
      }

      if (candidate) {
        const candidateId = candidate.id;

        // 2. Récupérer et supprimer les fichiers CV du bucket storage
        const { data: savedCvs } = await this.supabase.client
          .from('saved_cvs')
          .select('storage_path')
          .eq('candidate_id', candidateId);

        if (savedCvs && savedCvs.length > 0) {
          const cvPaths = savedCvs
            .filter(cv => cv.storage_path)
            .map(cv => cv.storage_path);

          if (cvPaths.length > 0) {
            const { error: storageError } = await this.supabase.client.storage
              .from('cvs')
              .remove(cvPaths);

            if (storageError) {
              this.logger.warn(`Erreur suppression fichiers CV: ${storageError.message}`);
            } else {
              result.deletedData.cvFiles = cvPaths.length;
              this.logger.log(`${cvPaths.length} fichiers CV supprimés du storage`);
            }
          }
        }

        // 3. Supprimer les enregistrements saved_cvs
        const { error: savedCvsError, count: savedCvsCount } = await this.supabase.client
          .from('saved_cvs')
          .delete()
          .eq('candidate_id', candidateId);

        if (savedCvsError) {
          this.logger.warn(`Erreur suppression saved_cvs: ${savedCvsError.message}`);
        } else {
          result.deletedData.savedCvs = savedCvsCount || 0;
          this.logger.log(`Enregistrements saved_cvs supprimés`);
        }

        // 4. Supprimer les candidatures
        const { error: applicationsError, count: applicationsCount } = await this.supabase.client
          .from('applications')
          .delete()
          .eq('candidate_id', candidateId);

        if (applicationsError) {
          this.logger.warn(`Erreur suppression applications: ${applicationsError.message}`);
        } else {
          result.deletedData.applications = applicationsCount || 0;
          this.logger.log(`Candidatures supprimées`);
        }

        // 5. Supprimer le profil candidat
        const { error: profileError } = await this.supabase.client
          .from('candidates')
          .delete()
          .eq('id', candidateId);

        if (profileError) {
          throw new BadRequestException(`Erreur suppression profil: ${profileError.message}`);
        }
        result.deletedData.profile = true;
        this.logger.log(`Profil candidat supprimé`);
      }

      // 6. Supprimer l'utilisateur auth (nécessite service_role_key)
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
        savedCvs: 0,
        applications: 0,
        profile: false,
        authUser: false,
      },
    };

    try {
      // 1. Récupérer le profil entreprise
      const { data: company, error: companyError } = await this.supabase.client
        .from('companies')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') {
        throw new BadRequestException(`Erreur récupération profil: ${companyError.message}`);
      }

      if (company) {
        const companyId = company.id;

        // 2. Supprimer les offres d'emploi
        const { error: offersError } = await this.supabase.client
          .from('offers')
          .delete()
          .eq('company_id', companyId);

        if (offersError) {
          this.logger.warn(`Erreur suppression offres: ${offersError.message}`);
        } else {
          this.logger.log(`Offres supprimées`);
        }

        // 3. Supprimer le profil entreprise
        const { error: profileError } = await this.supabase.client
          .from('companies')
          .delete()
          .eq('id', companyId);

        if (profileError) {
          throw new BadRequestException(`Erreur suppression profil: ${profileError.message}`);
        }
        result.deletedData.profile = true;
        this.logger.log(`Profil entreprise supprimé`);
      }

      // 4. Supprimer l'utilisateur auth
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
