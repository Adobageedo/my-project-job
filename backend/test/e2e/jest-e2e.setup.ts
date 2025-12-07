import * as dotenv from 'dotenv';

// Charger les variables d'environnement de test
dotenv.config({ path: '.env.test' });

// Configuration globale pour les tests
beforeAll(() => {
  console.log('🧪 Starting E2E tests...');
  console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);
});

afterAll(() => {
  console.log('✅ E2E tests completed');
});
