import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseOfferDto {
  @ApiProperty({ description: 'Texte de la fiche de poste à parser' })
  @IsString()
  text: string;

  @ApiProperty({ enum: ['text', 'pdf'], required: false })
  @IsEnum(['text', 'pdf'])
  @IsOptional()
  format?: string;
}
