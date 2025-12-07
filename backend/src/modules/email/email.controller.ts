import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@ApiTags('Email')
@Controller('email')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('notify/application')
  @ApiOperation({ summary: 'Notifier nouvelle candidature' })
  @ApiResponse({ status: 201, description: 'Email envoyé' })
  async notifyNewApplication(@Body() body: {
    companyEmail: string;
    companyName: string;
    candidateName: string;
    offerTitle: string;
    applicationId: string;
  }) {
    return this.emailService.notifyNewApplication(body);
  }

  @Post('notify/offer')
  @ApiOperation({ summary: 'Notifier nouvelle offre' })
  @ApiResponse({ status: 201, description: 'Email envoyé' })
  async notifyNewOffer(@Body() body: {
    candidateEmail: string;
    candidateName: string;
    companyName: string;
    offerTitle: string;
    offerId: string;
  }) {
    return this.emailService.notifyNewOffer(body);
  }

  @Post('notify/status-change')
  @ApiOperation({ summary: 'Notifier changement de statut' })
  @ApiResponse({ status: 201, description: 'Email envoyé' })
  async notifyStatusChange(@Body() body: {
    candidateEmail: string;
    candidateName: string;
    offerTitle: string;
    newStatus: string;
    applicationId: string;
  }) {
    return this.emailService.notifyApplicationStatusChange(body);
  }

  @Post('welcome')
  @ApiOperation({ summary: 'Envoyer email de bienvenue' })
  @ApiResponse({ status: 201, description: 'Email envoyé' })
  async sendWelcome(@Body() body: {
    email: string;
    firstName: string;
    userType: 'candidate' | 'company';
  }) {
    return this.emailService.sendWelcomeEmail(body);
  }
}
