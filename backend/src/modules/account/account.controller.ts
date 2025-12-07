import {
  Controller,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('/account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly accountService: AccountService) {}

  /**
   * DELETE /account/candidate
   * Supprime le compte candidat de l'utilisateur authentifié
   */
  @Delete('candidate')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteCandidateAccount(@Req() req: any) {
    const userId = req.user.id;
    this.logger.log(`Demande suppression compte candidat: ${userId}`);
    
    const result = await this.accountService.deleteCandidateAccount(userId);
    
    return {
      success: result.success,
      message: 'Compte candidat supprimé avec succès',
      deletedData: result.deletedData,
    };
  }

  /**
   * DELETE /account/company
   * Supprime le compte entreprise de l'utilisateur authentifié
   */
  @Delete('company')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteCompanyAccount(@Req() req: any) {
    const userId = req.user.id;
    this.logger.log(`Demande suppression compte entreprise: ${userId}`);
    
    const result = await this.accountService.deleteCompanyAccount(userId);
    
    return {
      success: result.success,
      message: 'Compte entreprise supprimé avec succès',
      deletedData: result.deletedData,
    };
  }
}
