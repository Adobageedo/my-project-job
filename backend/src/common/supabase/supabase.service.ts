import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private config: ConfigService) {
    // Créer le client avec service_role_key et options admin
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Client admin pour les opérations nécessitant service_role
   * (suppression d'utilisateurs, etc.)
   */
  get adminClient(): SupabaseClient {
    return this.supabase;
  }

  async verifyToken(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('role, company_roles')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Si aucun profil n'est trouvé, retourner un profil par défaut sans rôles
    const profile = Array.isArray(data) ? data[0] : data;
    return profile ?? { roles: [] };
  }
}
