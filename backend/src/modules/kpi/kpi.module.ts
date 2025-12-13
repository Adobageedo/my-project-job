import { Module } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SupabaseModule, EmailModule],
  controllers: [KpiController],
  providers: [KpiService],
  exports: [KpiService],
})
export class KpiModule {}
