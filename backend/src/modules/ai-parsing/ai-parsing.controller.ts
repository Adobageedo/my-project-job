import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AIParsingService } from './ai-parsing.service';
import { ParseOfferDto } from './dto/parse-offer.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');
import * as mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { pdf } from 'pdf-to-img';

// Allowed MIME types for CV upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/png',
];

// Use OptionalAuthGuard in development, SupabaseAuthGuard in production
const AuthGuard = process.env.NODE_ENV === 'development' ? OptionalAuthGuard : SupabaseAuthGuard;

// Helper: Check if text is meaningful (not just page markers or whitespace)
function isTextMeaningful(text: string): boolean {
  const cleaned = text?.trim() || '';
  if (cleaned.length < 50) return false;
  if (/^[\s\n\-0-9ofOf]+$/.test(cleaned)) return false;
  return true;
}

@ApiTags('AI Parsing')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('ai-parsing')
export class AIParsingController {
  constructor(private aiService: AIParsingService) {}

  @Post('cv')
  @ApiOperation({ summary: 'Upload et parse CV (PDF ou DOCX) avec IA' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CV file (PDF or DOCX, max 10MB)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, callback) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(new BadRequestException('Seuls les fichiers PDF, DOCX, JPG et PNG sont acceptés'), false);
      } else {
        callback(null, true);
      }
    },
  }))
  async parseCV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé');
    }

    let text = '';
    let imageBuffers: Buffer[] = [];
    const isPdf = file.mimetype === 'application/pdf';
    const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isImage = file.mimetype.startsWith('image/');

    try {
      // ========================================
      // STEP 1: Try regular text extraction
      // ========================================
      if (isPdf) {        
        try {
          const parser = new PDFParse({ data: file.buffer });
          const result = await parser.getText();
          text = result.text?.trim() || '';
          await parser.destroy?.();
        } catch (pdfError: any) {
        }
      } else if (isDocx) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value?.trim() || '';
      } else if (isImage) {
        imageBuffers = [file.buffer];
      }

      // ========================================
      // STEP 2: If text empty, try OCR with Tesseract
      // ========================================
      if (!isTextMeaningful(text)) {
        
        // Convert PDF to images if needed
        if (isPdf && imageBuffers.length === 0) {
          
          try {
            const pdfDocument = await pdf(file.buffer, { scale: 2 });
            let pageNum = 0;
            
            for await (const image of pdfDocument) {
              pageNum++;
              if (pageNum > 5) break; // Limit to 5 pages
              imageBuffers.push(image);
            }
          } catch (convError: any) {
            console.error('[AIParsingController] PDF to image conversion failed:', convError.message);
          }
        }

        // Run OCR on images
        if (imageBuffers.length > 0) {
          const ocrTexts: string[] = [];
          
          for (let i = 0; i < imageBuffers.length; i++) {
            try {
              const ocrResult = await Tesseract.recognize(imageBuffers[i], 'fra+eng', {
                logger: (m) => {
                  if (m.status === 'recognizing text' && m.progress > 0.9) {
                  }
                },
              });
              
              if (ocrResult.data.text?.trim()) {
                ocrTexts.push(ocrResult.data.text.trim());
              }
            } catch (ocrError: any) {
              console.error(`[AIParsingController] OCR failed for page ${i + 1}:`, ocrError.message);
            }
          }
          
          if (ocrTexts.length > 0) {
            text = ocrTexts.join('\n\n');
          }
        }
      }

      // ========================================
      // STEP 3: If still no text, use GPT-4 Vision
      // ========================================
      if (!isTextMeaningful(text) && imageBuffers.length > 0) {        
        // Convert first image to base64 and send to Vision API
        const base64Image = imageBuffers[0].toString('base64');
        const mimeType = isPdf ? 'image/png' : file.mimetype;
                
        // Use Vision API directly for parsing (returns structured data)
        return this.aiService.parseCVWithVision(base64Image, mimeType);
      }

      // ========================================
      // Final validation
      // ========================================
      if (!isTextMeaningful(text)) {
        throw new BadRequestException(
          'Impossible d\'extraire le texte du fichier après plusieurs tentatives. ' +
          'Le fichier semble corrompu ou dans un format non supporté.'
        );
      }

      // Parse extracted text with AI
      return this.aiService.parseCV({ text, format: isPdf ? 'pdf' : (isDocx ? 'docx' : 'image') });

    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      
      console.error('[AIParsingController] Unexpected error', {
        message: error?.message,
        stack: error?.stack,
      });
      throw new BadRequestException(`Erreur lors du traitement du fichier: ${error.message}`);
    }
  }

  @Post('job-offer')
  @ApiOperation({ summary: 'Parse fiche de poste avec IA (texte)' })
  async parseOffer(@Body() dto: ParseOfferDto) {
    return this.aiService.parseJobOffer(dto);
  }

  @Post('job-offer/upload')
  @ApiOperation({ summary: 'Upload et parse fiche de poste (PDF) avec IA' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Job offer PDF file (max 10MB)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, callback) => {
      if (file.mimetype !== 'application/pdf') {
        callback(new BadRequestException('Seuls les fichiers PDF sont acceptés'), false);
      } else {
        callback(null, true);
      }
    },
  }))
  async parseJobOfferUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier uploadé');
    }

    let text = '';
    let imageBuffers: Buffer[] = [];

    try {
      // ========================================
      // STEP 1: Try regular text extraction from PDF
      // ========================================
      try {
        const parser = new PDFParse({ data: file.buffer });
        const result = await parser.getText();
        text = result.text?.trim() || '';
        await parser.destroy?.();
      } catch (pdfError: any) {
        console.error('[AIParsingController] PDF text extraction failed:', pdfError.message);
      }

      // ========================================
      // STEP 2: If text empty, try OCR with Tesseract
      // ========================================
      if (!isTextMeaningful(text)) {
        // Convert PDF to images
        try {
          const pdfDocument = await pdf(file.buffer, { scale: 2 });
          let pageNum = 0;
          
          for await (const image of pdfDocument) {
            pageNum++;
            if (pageNum > 5) break; // Limit to 5 pages
            imageBuffers.push(image);
          }
        } catch (convError: any) {
          console.error('[AIParsingController] PDF to image conversion failed:', convError.message);
        }

        // Run OCR on images
        if (imageBuffers.length > 0) {
          const ocrTexts: string[] = [];
          
          for (let i = 0; i < imageBuffers.length; i++) {
            try {
              const ocrResult = await Tesseract.recognize(imageBuffers[i], 'fra+eng', {
                logger: () => {},
              });
              
              if (ocrResult.data.text?.trim()) {
                ocrTexts.push(ocrResult.data.text.trim());
              }
            } catch (ocrError: any) {
              console.error(`[AIParsingController] OCR failed for page ${i + 1}:`, ocrError.message);
            }
          }
          
          if (ocrTexts.length > 0) {
            text = ocrTexts.join('\n\n');
          }
        }
      }

      // ========================================
      // STEP 3: If still no text, use GPT-4 Vision
      // ========================================
      if (!isTextMeaningful(text) && imageBuffers.length > 0) {
        const base64Image = imageBuffers[0].toString('base64');
        return this.aiService.parseJobOfferWithVision(base64Image, 'image/png');
      }

      // ========================================
      // Final validation
      // ========================================
      if (!isTextMeaningful(text)) {
        throw new BadRequestException(
          'Impossible d\'extraire le texte du fichier. ' +
          'Le fichier semble corrompu ou dans un format non supporté.'
        );
      }

      // Parse extracted text with AI
      return this.aiService.parseJobOffer({ text, format: 'pdf' });

    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      
      console.error('[AIParsingController] Job offer parsing error', {
        message: error?.message,
        stack: error?.stack,
      });
      throw new BadRequestException(`Erreur lors du traitement du fichier: ${error.message}`);
    }
  }
}
