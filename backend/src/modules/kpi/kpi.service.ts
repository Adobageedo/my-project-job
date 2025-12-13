import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { EmailService } from '../email/email.service';

export interface KPISnapshot {
  companies_registered: number;
  candidates_registered: number;
  offers_created: number;
  total_applications: number;
  offers_filled: number;
  active_company_users: number;
  active_candidates: number;
  avg_applications_per_user: number;
  companies_with_active_users: number;
}

export interface AdminNotificationSettings {
  admin_id: string;
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'none';
  email_enabled: boolean;
  kpi_companies_registered: boolean;
  kpi_candidates_registered: boolean;
  kpi_offers_created: boolean;
  kpi_applications: boolean;
  kpi_offers_filled: boolean;
  kpi_active_company_users: boolean;
  kpi_active_candidates: boolean;
  kpi_avg_applications: boolean;
  kpi_companies_with_active: boolean;
}

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
    private emailService: EmailService,
  ) {}

  /**
   * Daily KPI snapshot - runs every day at 6:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async logDailyKPIs(): Promise<void> {
    this.logger.log('Starting daily KPI snapshot...');
    
    try {
      const kpis = await this.collectKPIs();
      
      await this.saveSnapshot(kpis, 'daily');
      
      this.logger.log('Daily KPI snapshot completed successfully');
      
      // Send daily notifications
      await this.sendKPINotifications('daily', kpis);
    } catch (error) {
      this.logger.error('Failed to log daily KPIs:', error);
    }
  }

  /**
   * Weekly KPI snapshot - runs every Monday at 7:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async logWeeklyKPIs(): Promise<void> {
    this.logger.log('Starting weekly KPI snapshot...');
    
    try {
      const kpis = await this.collectKPIs();
      
      await this.saveSnapshot(kpis, 'weekly');
      
      this.logger.log('Weekly KPI snapshot completed successfully');
      
      // Send weekly notifications
      await this.sendKPINotifications('weekly', kpis);
    } catch (error) {
      this.logger.error('Failed to log weekly KPIs:', error);
    }
  }

  /**
   * Monthly KPI snapshot - runs on the 1st of each month at 7:00 AM
   */
  @Cron('0 7 1 * *')
  async logMonthlyKPIs(): Promise<void> {
    this.logger.log('Starting monthly KPI snapshot...');
    
    try {
      const kpis = await this.collectKPIs();
      
      await this.saveSnapshot(kpis, 'monthly');
      
      this.logger.log('Monthly KPI snapshot completed successfully');
      
      // Send monthly notifications
      await this.sendKPINotifications('monthly', kpis);
    } catch (error) {
      this.logger.error('Failed to log monthly KPIs:', error);
    }
  }

  /**
   * Collect current KPIs from database
   */
  async collectKPIs(): Promise<KPISnapshot> {
    const client = this.supabase.client;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get counts
    const [
      { count: companiesCount },
      { count: candidatesCount },
      { count: offersCount },
      { count: applicationsCount },
      { count: filledOffersCount },
      { data: activeCompanyUsers },
      { data: activeCandidates },
    ] = await Promise.all([
      client.from('companies').select('*', { count: 'exact', head: true }),
      client.from('users').select('*', { count: 'exact', head: true }).eq('role', 'candidate'),
      client.from('job_offers').select('*', { count: 'exact', head: true }),
      client.from('applications').select('*', { count: 'exact', head: true }),
      client.from('job_offers').select('*', { count: 'exact', head: true }).eq('status', 'filled'),
      client.from('users')
        .select('id, company_id')
        .eq('role', 'company')
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString()),
      client.from('users')
        .select('id')
        .eq('role', 'candidate')
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString()),
    ]);

    // Unique companies with active users
    const companiesWithActiveUsers = new Set(
      (activeCompanyUsers || []).map((u: { company_id: string }) => u.company_id).filter(Boolean)
    ).size;

    // Average applications per active candidate
    let avgApplicationsPerUser = 0;
    const activeCandidateIds = (activeCandidates || []).map((u: { id: string }) => u.id);
    
    if (activeCandidateIds.length > 0) {
      const { count: activeUserApplications } = await client
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('user_id', activeCandidateIds);
      
      avgApplicationsPerUser = Math.round(((activeUserApplications || 0) / activeCandidateIds.length) * 10) / 10;
    }

    return {
      companies_registered: companiesCount || 0,
      candidates_registered: candidatesCount || 0,
      offers_created: offersCount || 0,
      total_applications: applicationsCount || 0,
      offers_filled: filledOffersCount || 0,
      active_company_users: activeCompanyUsers?.length || 0,
      active_candidates: activeCandidates?.length || 0,
      avg_applications_per_user: avgApplicationsPerUser,
      companies_with_active_users: companiesWithActiveUsers,
    };
  }

  /**
   * Save KPI snapshot to database
   */
  async saveSnapshot(kpis: KPISnapshot, periodType: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const client = this.supabase.client;
    const today = new Date().toISOString().split('T')[0];

    const { error } = await client
      .from('kpi_snapshots')
      .upsert({
        snapshot_date: today,
        period_type: periodType,
        ...kpis,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'snapshot_date,period_type',
      });

    if (error) {
      this.logger.error(`Failed to save ${periodType} KPI snapshot:`, error);
      throw error;
    }

    this.logger.log(`Saved ${periodType} KPI snapshot for ${today}`);
  }

  /**
   * Send KPI notifications to admins
   */
  async sendKPINotifications(
    frequency: 'daily' | 'weekly' | 'monthly',
    kpis: KPISnapshot,
  ): Promise<void> {
    const client = this.supabase.client;

    // Get admins with this notification frequency
    const { data: settings } = await client
      .from('admin_notification_settings')
      .select(`
        *,
        admin:users!admin_notification_settings_admin_id_fkey(email, first_name)
      `)
      .eq('frequency', frequency)
      .eq('email_enabled', true);

    if (!settings || settings.length === 0) {
      this.logger.log(`No admins configured for ${frequency} notifications`);
      return;
    }

    for (const setting of settings) {
      try {
        const admin = setting.admin as any;
        if (!admin?.email) continue;

        const html = this.buildKPIEmailHtml(setting, kpis, frequency);
        
        await this.emailService.sendRawEmail({
          to: admin.email,
          subject: `📊 Rapport KPI ${this.getFrequencyLabel(frequency)} - ${new Date().toLocaleDateString('fr-FR')}`,
          html,
        });

        this.logger.log(`Sent ${frequency} KPI report to ${admin.email}`);
      } catch (error) {
        this.logger.error(`Failed to send KPI notification to admin:`, error);
      }
    }
  }

  /**
   * Build KPI email HTML
   */
  private buildKPIEmailHtml(
    settings: AdminNotificationSettings,
    kpis: KPISnapshot,
    frequency: string,
  ): string {
    const kpiItems: string[] = [];

    if (settings.kpi_companies_registered) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">🏢 Entreprises inscrites</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.companies_registered}</td>
        </tr>
      `);
    }

    if (settings.kpi_candidates_registered) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">👥 Candidats inscrits</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.candidates_registered}</td>
        </tr>
      `);
    }

    if (settings.kpi_offers_created) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">📢 Offres créées</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.offers_created}</td>
        </tr>
      `);
    }

    if (settings.kpi_applications) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">📝 Candidatures</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.total_applications}</td>
        </tr>
      `);
    }

    if (settings.kpi_offers_filled) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">✅ Offres pourvues</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.offers_filled}</td>
        </tr>
      `);
    }

    if (settings.kpi_active_company_users) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">🏃 Utilisateurs entreprise actifs (30j)</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.active_company_users}</td>
        </tr>
      `);
    }

    if (settings.kpi_active_candidates) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">🎯 Candidats actifs (30j)</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.active_candidates}</td>
        </tr>
      `);
    }

    if (settings.kpi_avg_applications) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">📊 Moy. candidatures par candidat actif</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.avg_applications_per_user}</td>
        </tr>
      `);
    }

    if (settings.kpi_companies_with_active) {
      kpiItems.push(`
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">🏢 Entreprises avec utilisateurs actifs</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${kpis.companies_with_active_users}</td>
        </tr>
      `);
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport KPI ${this.getFrequencyLabel(frequency)}</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📊 Rapport KPI ${this.getFrequencyLabel(frequency)}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Indicateur</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Valeur</th>
              </tr>
            </thead>
            <tbody>
              ${kpiItems.join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${this.config.get('FRONTEND_URL')}/admin/dashboard" 
               style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
              Voir le dashboard complet
            </a>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center;">
            Vous recevez cet email car vous avez activé les notifications KPI ${this.getFrequencyLabel(frequency).toLowerCase()}.
            <br>
            <a href="${this.config.get('FRONTEND_URL')}/admin/notifications" style="color: #3b82f6;">
              Gérer mes préférences de notification
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
    };
    return labels[frequency] || frequency;
  }

  /**
   * Manual trigger for testing
   */
  async triggerKPISnapshot(periodType: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<KPISnapshot> {
    this.logger.log(`Manually triggering ${periodType} KPI snapshot...`);
    
    const kpis = await this.collectKPIs();
    await this.saveSnapshot(kpis, periodType);
    
    return kpis;
  }
}
