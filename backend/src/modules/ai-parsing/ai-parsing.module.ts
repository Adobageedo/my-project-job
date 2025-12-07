import { Module } from '@nestjs/common';
import { AIParsingController } from './ai-parsing.controller';
import { AIParsingService } from './ai-parsing.service';
import { OpenAIProvider } from './providers/openai.provider';

@Module({
  controllers: [AIParsingController],
  providers: [AIParsingService, OpenAIProvider],
  exports: [AIParsingService],
})
export class AIParsingModule {}
