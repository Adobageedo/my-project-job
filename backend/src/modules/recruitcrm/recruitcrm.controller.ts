import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecruitCRMService } from './recruitcrm.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@ApiTags('RecruitCRM')
@Controller('recruitcrm')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class RecruitCRMController {
  constructor(private readonly recruitCRMService: RecruitCRMService) {}

  @Post('sync/candidate/:id')
  @ApiOperation({ summary: 'Synchroniser un candidat vers RecruitCRM' })
  @ApiResponse({ status: 201, description: 'Candidat synchronisé' })
  async syncCandidate(@Param('id') id: string) {
    return this.recruitCRMService.syncCandidate(id);
  }

  @Post('sync/company/:id')
  @ApiOperation({ summary: 'Synchroniser une entreprise vers RecruitCRM' })
  @ApiResponse({ status: 201, description: 'Entreprise synchronisée' })
  async syncCompany(@Param('id') id: string) {
    return this.recruitCRMService.syncCompany(id);
  }

  @Post('sync/job-offer/:id')
  @ApiOperation({ summary: 'Synchroniser une offre vers RecruitCRM' })
  @ApiResponse({ status: 201, description: 'Offre synchronisée' })
  async syncJobOffer(@Param('id') id: string) {
    return this.recruitCRMService.syncJobOffer(id);
  }

  @Post('sync/all')
  @ApiOperation({ summary: 'Synchronisation complète (admin)' })
  @ApiResponse({ status: 201, description: 'Synchronisation lancée' })
  async syncAll() {
    return this.recruitCRMService.syncAll();
  }

  @Get('status')
  @ApiOperation({ summary: 'État de la synchronisation' })
  @ApiResponse({ status: 200, description: 'État retourné' })
  async getStatus() {
    // TODO: Récupérer stats depuis recruitcrm_sync table
    return { message: 'Not implemented yet' };
  }
}
