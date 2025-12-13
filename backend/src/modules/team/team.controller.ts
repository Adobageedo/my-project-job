import { Controller, Post, Body, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

interface InviteManagerDto {
  email: string;
  companyId: string;
  role: 'manager' | 'rh';
  permissions: Record<string, unknown>;
  offerIds?: string[];
}

@ApiTags('Team')
@Controller('team')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Inviter un manager à rejoindre l\'équipe' })
  @ApiResponse({ status: 201, description: 'Invitation envoyée' })
  @ApiResponse({ status: 400, description: 'Erreur de validation' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  async inviteManager(
    @Body() body: InviteManagerDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new HttpException('Non authentifié', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.teamService.inviteManager(
      {
        email: body.email,
        companyId: body.companyId,
        invitedBy: userId,
        role: body.role,
        permissions: body.permissions,
        offerIds: body.offerIds,
      },
      userId,
    );

    if (!result.success) {
      throw new HttpException(result.error || 'Erreur', HttpStatus.BAD_REQUEST);
    }

    return { success: true, message: 'Invitation envoyée' };
  }
}
