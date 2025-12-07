import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import axios, { AxiosInstance } from 'axios';

interface RecruitCRMCandidate {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string; // École
  current_title?: string; // Niveau d'études
  skills?: string[];
}

interface RecruitCRMCompany {
  id?: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
}

interface RecruitCRMJob {
  id?: string;
  title: string;
  description?: string;
  company_id?: string;
  status?: string;
  skills?: string[];
  location?: string;
}

@Injectable()
export class RecruitCRMService {
  private readonly logger = new Logger(RecruitCRMService.name);
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;
  private enabled: boolean;

  constructor(
    private config: ConfigService,
    private supabase: SupabaseService,
  ) {
    this.apiKey = this.config.get<string>('RECRUITCRM_API_KEY') || '';
    this.baseURL = this.config.get<string>('RECRUITCRM_API_URL') || 'https://api.recruitcrm.io/v1';
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      this.logger.warn('RecruitCRM API key not configured. Sync disabled.');
      return;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Synchroniser un candidat vers RecruitCRM
   */
  async syncCandidate(candidateId: string): Promise<{ recruitcrmId: string }> {
    if (!this.enabled) {
      throw new Error('RecruitCRM sync not enabled');
    }

    this.logger.log(`Syncing candidate ${candidateId} to RecruitCRM`);

    try {
      // Récupérer le candidat depuis Supabase
      const { data: candidate, error } = await this.supabase.client
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (error || !candidate) {
        throw new Error(`Candidate ${candidateId} not found`);
      }

      // Vérifier si déjà sync
      const { data: existingSync } = await this.supabase.client
        .from('recruitcrm_sync')
        .select('*')
        .eq('entity_type', 'candidate')
        .eq('entity_id', candidateId)
        .maybeSingle();

      let recruitcrmId: string;

      if (existingSync && existingSync.recruitcrm_id) {
        // Mettre à jour
        recruitcrmId = existingSync.recruitcrm_id;
        await this.updateCRMCandidate(recruitcrmId, candidate);
      } else {
        // Créer
        recruitcrmId = await this.createCRMCandidate(candidate);
      }

      // Logger la sync
      await this.logSync({
        entityType: 'candidate',
        entityId: candidateId,
        recruitcrmId,
        syncStatus: 'synced',
      });

      return { recruitcrmId };
    } catch (error: any) {
      this.logger.error(`Failed to sync candidate: ${error.message}`, error);

      await this.logSync({
        entityType: 'candidate',
        entityId: candidateId,
        syncStatus: 'error',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Synchroniser une entreprise vers RecruitCRM
   */
  async syncCompany(companyId: string): Promise<{ recruitcrmId: string }> {
    if (!this.enabled) {
      throw new Error('RecruitCRM sync not enabled');
    }

    this.logger.log(`Syncing company ${companyId} to RecruitCRM`);

    try {
      const { data: company, error } = await this.supabase.client
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error || !company) {
        throw new Error(`Company ${companyId} not found`);
      }

      const { data: existingSync } = await this.supabase.client
        .from('recruitcrm_sync')
        .select('*')
        .eq('entity_type', 'company')
        .eq('entity_id', companyId)
        .maybeSingle();

      let recruitcrmId: string;

      if (existingSync && existingSync.recruitcrm_id) {
        recruitcrmId = existingSync.recruitcrm_id;
        await this.updateCRMCompany(recruitcrmId, company);
      } else {
        recruitcrmId = await this.createCRMCompany(company);
      }

      await this.logSync({
        entityType: 'company',
        entityId: companyId,
        recruitcrmId,
        syncStatus: 'synced',
      });

      return { recruitcrmId };
    } catch (error: any) {
      this.logger.error(`Failed to sync company: ${error.message}`, error);

      await this.logSync({
        entityType: 'company',
        entityId: companyId,
        syncStatus: 'error',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Synchroniser une offre vers RecruitCRM
   */
  async syncJobOffer(offerId: string): Promise<{ recruitcrmId: string }> {
    if (!this.enabled) {
      throw new Error('RecruitCRM sync not enabled');
    }

    this.logger.log(`Syncing job offer ${offerId} to RecruitCRM`);

    try {
      const { data: offer, error } = await this.supabase.client
        .from('job_offers')
        .select('*, companies(*)')
        .eq('id', offerId)
        .single();

      if (error || !offer) {
        throw new Error(`Job offer ${offerId} not found`);
      }

      // Sync company first if needed
      if (offer.company_id) {
        await this.syncCompany(offer.company_id);
      }

      const { data: existingSync } = await this.supabase.client
        .from('recruitcrm_sync')
        .select('*')
        .eq('entity_type', 'job_offer')
        .eq('entity_id', offerId)
        .maybeSingle();

      let recruitcrmId: string;

      if (existingSync && existingSync.recruitcrm_id) {
        recruitcrmId = existingSync.recruitcrm_id;
        await this.updateCRMJob(recruitcrmId, offer);
      } else {
        recruitcrmId = await this.createCRMJob(offer);
      }

      await this.logSync({
        entityType: 'job_offer',
        entityId: offerId,
        recruitcrmId,
        syncStatus: 'synced',
      });

      return { recruitcrmId };
    } catch (error: any) {
      this.logger.error(`Failed to sync job offer: ${error.message}`, error);

      await this.logSync({
        entityType: 'job_offer',
        entityId: offerId,
        syncStatus: 'error',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Synchronisation complète (batch)
   */
  async syncAll(): Promise<{ candidates: number; companies: number; jobOffers: number }> {
    this.logger.log('Starting full sync...');

    const stats = { candidates: 0, companies: 0, jobOffers: 0 };

    // Sync companies
    const { data: companies } = await this.supabase.client
      .from('companies')
      .select('id')
      .eq('status', 'active');

    if (companies) {
      for (const company of companies) {
        try {
          await this.syncCompany(company.id);
          stats.companies++;
        } catch (error) {
          this.logger.error(`Failed to sync company ${company.id}`);
        }
      }
    }

    // Sync candidates
    const { data: candidates } = await this.supabase.client
      .from('candidates')
      .select('id');

    if (candidates) {
      for (const candidate of candidates) {
        try {
          await this.syncCandidate(candidate.id);
          stats.candidates++;
        } catch (error) {
          this.logger.error(`Failed to sync candidate ${candidate.id}`);
        }
      }
    }

    // Sync job offers
    const { data: jobOffers } = await this.supabase.client
      .from('job_offers')
      .select('id')
      .eq('status', 'active');

    if (jobOffers) {
      for (const offer of jobOffers) {
        try {
          await this.syncJobOffer(offer.id);
          stats.jobOffers++;
        } catch (error) {
          this.logger.error(`Failed to sync job offer ${offer.id}`);
        }
      }
    }

    this.logger.log(`Sync completed: ${JSON.stringify(stats)}`);
    return stats;
  }

  // ========== Private Methods ==========

  private async createCRMCandidate(candidate: any): Promise<string> {
    const payload: RecruitCRMCandidate = {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      company: candidate.school,
      current_title: candidate.study_level,
      skills: candidate.skills || [],
    };

    const response = await this.client.post('/candidates', payload);
    return response.data.id;
  }

  private async updateCRMCandidate(id: string, candidate: any): Promise<void> {
    const payload: Partial<RecruitCRMCandidate> = {
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      company: candidate.school,
      current_title: candidate.study_level,
      skills: candidate.skills || [],
    };

    await this.client.put(`/candidates/${id}`, payload);
  }

  private async createCRMCompany(company: any): Promise<string> {
    const payload: RecruitCRMCompany = {
      name: company.name,
      industry: company.sector,
      size: company.size,
    };

    const response = await this.client.post('/companies', payload);
    return response.data.id;
  }

  private async updateCRMCompany(id: string, company: any): Promise<void> {
    const payload: Partial<RecruitCRMCompany> = {
      name: company.name,
      industry: company.sector,
      size: company.size,
    };

    await this.client.put(`/companies/${id}`, payload);
  }

  private async createCRMJob(offer: any): Promise<string> {
    // Get company CRM ID
    const { data: companySync } = await this.supabase.client
      .from('recruitcrm_sync')
      .select('recruitcrm_id')
      .eq('entity_type', 'company')
      .eq('entity_id', offer.company_id)
      .single();

    const payload: RecruitCRMJob = {
      title: offer.title,
      description: offer.description,
      company_id: companySync?.recruitcrm_id,
      status: offer.status,
      skills: offer.skills || [],
      location: offer.location,
    };

    const response = await this.client.post('/jobs', payload);
    return response.data.id;
  }

  private async updateCRMJob(id: string, offer: any): Promise<void> {
    const payload: Partial<RecruitCRMJob> = {
      title: offer.title,
      description: offer.description,
      status: offer.status,
      skills: offer.skills || [],
      location: offer.location,
    };

    await this.client.put(`/jobs/${id}`, payload);
  }

  private async logSync(params: {
    entityType: string;
    entityId: string;
    recruitcrmId?: string;
    syncStatus: 'synced' | 'pending' | 'error';
    errorMessage?: string;
  }) {
    try {
      await this.supabase.client
        .from('recruitcrm_sync')
        .upsert({
          entity_type: params.entityType,
          entity_id: params.entityId,
          recruitcrm_id: params.recruitcrmId,
          sync_status: params.syncStatus,
          last_synced_at: params.syncStatus === 'synced' ? new Date().toISOString() : null,
          error_message: params.errorMessage,
        }, {
          onConflict: 'entity_type,entity_id',
        });
    } catch (error: any) {
      this.logger.error(`Failed to log sync: ${error.message}`);
    }
  }
}
