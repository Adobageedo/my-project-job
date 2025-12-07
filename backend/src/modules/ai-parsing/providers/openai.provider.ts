import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';

// Niveaux d'études supportés
const STUDY_LEVELS = ['bac', 'bac+1', 'bac+2', 'bac+3', 'bac+4', 'bac+5', 'bac+6', 'doctorat'] as const;

// Types de contrat supportés
const CONTRACT_TYPES = ['stage', 'alternance', 'apprentissage'] as const;

// Schéma CV - tous les champs optionnels pour tolérer les réponses partielles
const CVSchema = z.object({
  firstName: z.string().optional().nullable().transform(v => v ?? undefined),
  lastName: z.string().optional().nullable().transform(v => v ?? undefined),
  phone: z.string().optional().nullable().transform(v => v ?? undefined),
  school: z.string().optional().nullable().transform(v => v ?? undefined),
  studyLevel: z.enum(STUDY_LEVELS).optional().nullable().transform(v => v ?? undefined),
  specialization: z.string().optional().nullable().transform(v => v ?? undefined),
  locations: z.array(z.string()).optional().nullable().transform(v => v ?? undefined),
  contractType: z.enum(CONTRACT_TYPES).optional().nullable().transform(v => v ?? undefined),
  availableFrom: z.string().optional().nullable().transform(v => v ?? undefined),
  skills: z.array(z.string()).optional().nullable().transform(v => v ?? undefined),
  linkedinUrl: z.string().optional().nullable().transform(v => v ?? undefined),
  portfolioUrl: z.string().optional().nullable().transform(v => v ?? undefined),
  bio: z.string().optional().nullable().transform(v => v ?? undefined),
});

// Schéma Job Offer - title et contractType ont des défauts, le reste est optionnel
const JobOfferSchema = z.object({
  title: z.string().optional().nullable().transform(v => v ?? 'Offre de stage'),
  description: z.string().optional().nullable().transform(v => v ?? undefined),
  missions: z.array(z.string()).optional().nullable().transform(v => v ?? undefined),
  objectives: z.string().optional().nullable().transform(v => v ?? undefined),
  studyLevels: z.array(z.enum(['L3', 'M1', 'M2', 'MBA'])).optional().nullable().transform(v => v ?? undefined),
  skills: z.array(z.string()).optional().nullable().transform(v => v ?? undefined),
  contractType: z.enum(['stage', 'alternance', 'apprentissage']).optional().nullable().transform(v => v ?? 'stage'),
  duration: z.string().optional().nullable().transform(v => v ?? undefined),
  startDate: z.string().optional().nullable().transform(v => v ?? undefined),
  location: z.string().optional().nullable().transform(v => v ?? undefined),
  salary: z.string().optional().nullable().transform(v => v ?? undefined),
});

// Types exportés
export type ParsedCV = z.output<typeof CVSchema>;
export type ParsedJobOffer = z.output<typeof JobOfferSchema>;

@Injectable()
export class OpenAIProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private openai: OpenAI;
  public model: string;
  private maxTokens: number;
  private temperature: number;
  private maxRetries = 3;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });

    this.model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    this.maxTokens = this.config.get<number>('OPENAI_MAX_TOKENS') || 2000;
    this.temperature = this.config.get<number>('OPENAI_TEMPERATURE') || 0.3;
  }

  /**
   * Nettoie les données JSON en remplaçant les null par undefined
   */
  private cleanNullValues(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) {
        // Supprimer les clés null au lieu de les garder
        continue;
      } else if (Array.isArray(value)) {
        cleaned[key] = value.filter((v) => v !== null);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.cleanNullValues(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Prompt système pour le parsing de CV
   */
  private getCVSystemPrompt(): string {
    return `Tu es un expert en extraction de données de CV pour des candidats recherchant des stages ou alternances.

IMPORTANT: Retourne UNIQUEMENT un objet JSON valide, sans texte avant ou après.
Si une information n'est pas trouvée, OMETS le champ (ne mets PAS null).

Format attendu:
{
  "firstName": "string - Prénom du candidat",
  "lastName": "string - Nom du candidat",
  "phone": "string - Numéro de téléphone",
  "school": "string - École ou université",
  "studyLevel": "bac" | "bac+1" | "bac+2" | "bac+3" | "bac+4" | "bac+5" | "bac+6" | "doctorat",
  "specialization": "string - Spécialisation/filière d'études",
  "locations": ["array de villes souhaitées pour travailler"],
  "contractType": "stage" | "alternance" | "apprentissage",
  "availableFrom": "string - Date de disponibilité format YYYY-MM-DD si trouvée",
  "skills": ["array", "de", "compétences techniques et soft skills"],
  "linkedinUrl": "string - URL LinkedIn si trouvée",
  "portfolioUrl": "string - URL portfolio ou site web si trouvée",
  "bio": "string - Résumé/présentation du candidat si trouvé"
}

RÈGLES:
- studyLevel: déduis le niveau d'études actuel (bac+1 à bac+6 ou doctorat)
- locations: extrait les villes mentionnées comme lieux de travail souhaités
- skills: extrait toutes les compétences techniques (langages, outils) et soft skills
- bio: synthétise le profil du candidat en 2-3 phrases si possible`;
  }

  /**
   * Prompt système pour le parsing d'offres d'emploi
   */
  private getJobOfferSystemPrompt(): string {
    return `Tu es un expert en extraction de données de fiches de poste pour des stages en finance.

IMPORTANT: Retourne UNIQUEMENT un objet JSON valide, sans texte avant ou après.
Si une information n'est pas trouvée, OMETS le champ (ne mets PAS null).

Format attendu:
{
  "title": "string OBLIGATOIRE - titre du poste",
  "description": "string ou omis",
  "missions": ["array", "de", "missions"] ou omis,
  "objectives": "string ou omis",
  "studyLevels": ["L3", "M1", "M2", "MBA"] ou omis,
  "skills": ["array", "de", "compétences"] ou omis,
  "contractType": "stage" | "alternance" | "apprentissage" - défaut "stage",
  "duration": "string ex: '6 mois' ou omis",
  "startDate": "string ex: 'Janvier 2025' ou omis",
  "location": "string ex: 'Paris' ou omis",
  "salary": "string ex: '1500€/mois' ou omis"
}`;
  }

  /**
   * Appel OpenAI avec gestion d'erreur
   */
  private async callOpenAI(systemPrompt: string, userContent: string): Promise<{ content: string; usage: OpenAI.Completions.CompletionUsage | undefined }> {
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_completion_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    return { content, usage: completion.usage };
  }

  /**
   * Parse un CV avec validation et retry automatique
   */
  async parseCV(text: string): Promise<{ data: ParsedCV; usage: OpenAI.Completions.CompletionUsage | undefined }> {
    const { content, usage } = await this.callOpenAI(this.getCVSystemPrompt(), text);

    const raw = JSON.parse(content);
    const parsedData = this.cleanNullValues(raw);

    const result = CVSchema.safeParse(parsedData);
    if (result.success) {
      return { data: result.data, usage };
    }

    // Log et retry si échec
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    this.logger.warn(`CV validation failed: ${errors}. Retrying...`);

    const retryPrompt = `${this.getCVSystemPrompt()}

CORRECTION REQUISE: La réponse précédente avait ces erreurs: ${errors}
Corrige ces erreurs et retourne un JSON valide. N'utilise JAMAIS null.`;

    const { content: retryContent } = await this.callOpenAI(retryPrompt, text);
    const retryData = this.cleanNullValues(JSON.parse(retryContent));

    // Validation finale (utilise parse qui throw si échec)
    const validated = CVSchema.parse(retryData);
    return { data: validated, usage };
  }

  /**
   * Parse une offre d'emploi avec validation et retry automatique
   */
  async parseJobOffer(text: string): Promise<{ data: ParsedJobOffer; usage: OpenAI.Completions.CompletionUsage | undefined }> {
    const { content, usage } = await this.callOpenAI(this.getJobOfferSystemPrompt(), text);
    const parsedData = this.cleanNullValues(JSON.parse(content));

    // Première tentative de validation
    const result = JobOfferSchema.safeParse(parsedData);
    if (result.success) {
      return { data: result.data, usage };
    }

    // Log et retry si échec
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    this.logger.warn(`Job offer validation failed: ${errors}. Retrying...`);

    const retryPrompt = `${this.getJobOfferSystemPrompt()}

CORRECTION REQUISE: La réponse précédente avait ces erreurs: ${errors}
Assure-toi que:
- title est une string non vide (défaut: "Offre de stage")
- contractType est "stage", "alternance" ou "apprentissage" (défaut: "stage")
- N'utilise JAMAIS null, omets les champs manquants

Corrige et retourne un JSON valide.`;

    const { content: retryContent } = await this.callOpenAI(retryPrompt, text);
    const retryData = this.cleanNullValues(JSON.parse(retryContent));

    // Validation finale
    const validated = JobOfferSchema.parse(retryData);
    return { data: validated, usage };
  }

  /**
   * Parse un CV à partir d'une image avec GPT-4 Vision
   */
  async parseCVWithVision(base64Image: string, mimeType: string): Promise<{ data: ParsedCV; usage: OpenAI.Completions.CompletionUsage | undefined }> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: this.getCVSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyse cette image de CV et extrait les informations demandées. Retourne UNIQUEMENT le JSON, sans texte avant ou après.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No response from GPT-4 Vision');

    const raw = JSON.parse(content);
    const parsedData = this.cleanNullValues(raw);
    const result = CVSchema.safeParse(parsedData);

    if (result.success) {
      return { data: result.data, usage: completion.usage };
    }

    // Log validation errors
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    this.logger.warn(`CV Vision validation failed: ${errors}`);

    // Return partial data anyway (all fields are optional)
    return { data: parsedData as ParsedCV, usage: completion.usage };
  }
}
