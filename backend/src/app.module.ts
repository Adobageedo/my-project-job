import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Common modules
import { LoggerModule } from './common/logger/logger.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { HealthModule } from './common/health/health.module';

// Feature modules
import { AIParsingModule } from './modules/ai-parsing/ai-parsing.module';
import { RecruitCRMModule } from './modules/recruitcrm/recruitcrm.module';
import { EmailModule } from './modules/email/email.module';
import { AdminModule } from './modules/admin/admin.module';
import { AccountModule } from './modules/account/account.module';

// Config validation
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.prod',
      validate: validateEnv,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Common modules
    LoggerModule,
    SupabaseModule,
    HealthModule,

    // Feature modules
    AIParsingModule,
    RecruitCRMModule,
    EmailModule,
    AdminModule,
    AccountModule,
  ],
})
export class AppModule {}
