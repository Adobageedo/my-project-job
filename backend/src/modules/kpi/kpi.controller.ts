import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { KpiService, KPISnapshot } from './kpi.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('kpi')
@UseGuards(SupabaseAuthGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  /**
   * Get current platform KPIs
   * Note: Should be restricted to admin role in production
   */
  @Get('current')
  async getCurrentKPIs(): Promise<KPISnapshot> {
    return this.kpiService.collectKPIs();
  }

  /**
   * Manually trigger a KPI snapshot (for testing/manual runs)
   * Note: Should be restricted to admin role in production
   */
  @Post('snapshot')
  async triggerSnapshot(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<{ success: boolean; kpis: KPISnapshot }> {
    const kpis = await this.kpiService.triggerKPISnapshot(period);
    return { success: true, kpis };
  }
}
