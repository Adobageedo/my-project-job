import { Module } from '@nestjs/common';
import { RecruitCRMController } from './recruitcrm.controller';
import { RecruitCRMService } from './recruitcrm.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [RecruitCRMController],
  providers: [RecruitCRMService],
  exports: [RecruitCRMService],
})
export class RecruitCRMModule {}
