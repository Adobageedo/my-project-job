import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private supabase: SupabaseService) {}

  @Get()
  async check() {
    // Vérifier la connexion Supabase
    const { error } = await this.supabase.client.from('user_profiles').select('count').limit(1);
    
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      database: 'supabase',
    };
  }
}
