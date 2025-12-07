import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { ParseCVDto } from './dto/parse-cv.dto';
import { ParseOfferDto } from './dto/parse-offer.dto';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoggerService } from '../../common/logger/logger.service';
import { withRetry } from '../../common/utils/retry.util';

@Injectable()
export class AIParsingService {
  constructor(
    private openai: OpenAIProvider,
    private supabase: SupabaseService,
    private logger: LoggerService,
  ) {}

  async parseCV(dto: ParseCVDto) {
    const startTime = Date.now();

    try {
      const result = await withRetry(() => this.openai.parseCV(dto.text), {
        maxAttempts: 3,
        initialDelay: 1000,
      });

      // Log dans Supabase
      await this.supabase.client.from('ai_parsing_logs').insert({
        entity_type: 'cv',
        input_type: dto.format || 'text',
        input_size: dto.text.length,
        model: this.openai.model,
        prompt_tokens: result.usage?.prompt_tokens,
        response_tokens: result.usage?.completion_tokens,
        total_cost: this.calculateCost(result.usage),
        status: 'success',
        duration: Date.now() - startTime,
        parsed_data: result.data,
      });

      return result.data;
    } catch (error: any) {
      this.logger.error(`CV parsing failed: ${error.message}`, error.stack, 'AIParsingService');

      await this.supabase.client.from('ai_parsing_logs').insert({
        entity_type: 'cv',
        input_type: dto.format || 'text',
        input_size: dto.text.length,
        model: this.openai.model,
        status: 'error',
        duration: Date.now() - startTime,
        error_message: error.message,
      });

      throw error;
    }
  }

  async parseCVWithVision(base64Image: string, mimeType: string) {
    const startTime = Date.now();

    try {
      const result = await withRetry(() => this.openai.parseCVWithVision(base64Image, mimeType), {
        maxAttempts: 2,
        initialDelay: 1000,
      });

      // Log dans Supabase
      await this.supabase.client.from('ai_parsing_logs').insert({
        entity_type: 'cv',
        input_type: 'vision',
        input_size: base64Image.length,
        model: 'gpt-4o',
        prompt_tokens: result.usage?.prompt_tokens,
        response_tokens: result.usage?.completion_tokens,
        total_cost: this.calculateCost(result.usage),
        status: 'success',
        duration: Date.now() - startTime,
        parsed_data: result.data,
      });

      return result.data;
    } catch (error: any) {
      this.logger.error(`CV Vision parsing failed: ${error.message}`, error.stack, 'AIParsingService');

      await this.supabase.client.from('ai_parsing_logs').insert({
        entity_type: 'cv',
        input_type: 'vision',
        input_size: base64Image.length,
        model: 'gpt-4o',
        status: 'error',
        duration: Date.now() - startTime,
        error_message: error.message,
      });

      throw error;
    }
  }

  async parseJobOffer(dto: ParseOfferDto) {
    const startTime = Date.now();

    try {
      const result = await withRetry(() => this.openai.parseJobOffer(dto.text), {
        maxAttempts: 3,
        initialDelay: 1000,
      });

      await this.supabase.client.from('ai_parsing_logs').insert({
        entity_type: 'offer',
        input_type: dto.format || 'text',
        input_size: dto.text.length,
        model: this.openai.model,
        prompt_tokens: result.usage?.prompt_tokens,
        response_tokens: result.usage?.completion_tokens,
        total_cost: this.calculateCost(result.usage),
        status: 'success',
        duration: Date.now() - startTime,
        parsed_data: result.data,
      });

      return result.data;
    } catch (error: any) {
      this.logger.error(
        `Offer parsing failed: ${error.message}`,
        error.stack,
        'AIParsingService',
      );

      await this.supabase.client.from('ai_parsing_logs').insert({
        entity_type: 'offer',
        input_type: dto.format || 'text',
        input_size: dto.text.length,
        model: this.openai.model,
        status: 'error',
        duration: Date.now() - startTime,
        error_message: error.message,
      });

      throw error;
    }
  }

  private calculateCost(usage?: { prompt_tokens?: number; completion_tokens?: number }): number {
    if (!usage) return 0;
    // GPT-4 Turbo pricing
    const promptCost = (usage.prompt_tokens || 0) * (0.01 / 1000);
    const completionCost = (usage.completion_tokens || 0) * (0.03 / 1000);
    return promptCost + completionCost;
  }
}
