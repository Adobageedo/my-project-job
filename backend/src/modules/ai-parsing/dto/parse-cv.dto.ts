import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseCVDto {
  @ApiProperty({ description: 'Texte du CV à parser' })
  @IsString()
  text: string;

  @ApiProperty({ enum: ['text', 'pdf'], required: false })
  @IsEnum(['text', 'pdf'])
  @IsOptional()
  format?: string;
}
