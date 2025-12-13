import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SupabaseModule, EmailModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
