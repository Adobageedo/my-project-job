import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const isDev = this.config.get<string>('NODE_ENV') === 'development';

    // En mode dev, bypass l'authentification
    if (false) {
      this.logger.warn('⚠️ DEV MODE: Authentication bypassed');
      request.user = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        roles: ['candidate'],
      };
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const user = await this.supabase.verifyToken(token);
      const profile = await this.supabase.getUserProfile(user.id);

      request.user = {
        id: user.id,
        email: user.email,
        roles: profile.roles,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
