import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.test' });

// Configuration Supabase pour les tests
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Utilisateur de test (à créer dans Supabase)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Récupère automatiquement un token JWT valide pour les tests
 */
export async function getTestToken(): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  if (error) {
    throw new Error(`Failed to get test token: ${error.message}`);
  }

  if (!data.session?.access_token) {
    throw new Error('No access token returned');
  }

  return data.session.access_token;
}

/**
 * Crée un utilisateur de test si nécessaire
 */
export async function createTestUserIfNeeded(): Promise<void> {
  // Essayer de se connecter d'abord
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  // Si l'utilisateur n'existe pas, le créer
  if (signInError?.message?.includes('Invalid login credentials')) {
    const { error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (signUpError) {
      console.warn(`Could not create test user: ${signUpError.message}`);
    } else {
      console.log(`Test user created: ${TEST_USER_EMAIL}`);
    }
  }
}

/**
 * Nettoie la session de test
 */
export async function cleanupTestSession(): Promise<void> {
  await supabase.auth.signOut();
}
