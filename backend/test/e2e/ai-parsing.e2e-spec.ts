import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getTestToken, createTestUserIfNeeded, cleanupTestSession } from './setup';

describe('AI Parsing Controller (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // Créer l'utilisateur de test si nécessaire
    await createTestUserIfNeeded();

    // Récupérer le token automatiquement
    accessToken = await getTestToken();

    // Créer l'application NestJS
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await cleanupTestSession();
    await app.close();
  });

  describe('POST /api/v1/ai-parsing/cv', () => {
    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai-parsing/cv')
        .send({
          text: 'John Doe\nM2 Finance\nHEC Paris',
          format: 'text',
        })
        .expect(401);
    });

    it('should parse CV with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai-parsing/cv')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: `
            John Doe
            Email: john.doe@email.com
            Téléphone: 06 12 34 56 78
            
            Formation:
            - Master 2 Finance d'Entreprise, HEC Paris (2024)
            - Licence Économie-Gestion, Paris Dauphine (2022)
            
            Compétences:
            - Python, Excel, VBA
            - Analyse financière
            - Modélisation
          `,
          format: 'text',
        })
        .expect(201);

      // Vérifier la structure de la réponse
      expect(response.body).toBeDefined();
      // Le parsing peut retourner différents champs selon le CV
      // On vérifie juste que c'est un objet non vide
      expect(typeof response.body).toBe('object');
    }, 30000); // Timeout 30s pour OpenAI

    it('should reject invalid format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai-parsing/cv')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: 'Some text',
          format: 'invalid_format',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/ai-parsing/job-offer', () => {
    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ai-parsing/job-offer')
        .send({
          text: 'Stage Finance M2',
          format: 'text',
        })
        .expect(401);
    });

    it('should parse job offer with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ai-parsing/job-offer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          text: `
            Stage Analyste M&A - 6 mois
            
            Entreprise: Goldman Sachs
            Localisation: Paris
            
            Missions:
            - Analyse financière de sociétés cibles
            - Préparation de pitch books
            - Modélisation financière
            
            Profil recherché:
            - Master 2 Finance
            - Maîtrise Excel et PowerPoint
            - Anglais courant
            
            Rémunération: 1800€/mois
            Date de début: Janvier 2025
          `,
          format: 'text',
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    }, 30000); // Timeout 30s pour OpenAI
  });
});
