#!/usr/bin/env ts-node
/**
 * Script de diagnostic Supabase
 * Usage: npx ts-node test/e2e/check-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🔍 Diagnostic Supabase\n', 'bold');

  // 1. Vérifier les variables d'environnement
  log('📋 Variables d\'environnement:', 'blue');
  
  const vars = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓ défini' : '✗ manquant',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ défini' : '✗ manquant',
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET ? '✓ défini' : '✗ manquant',
    TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
    TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD ? '✓ défini' : '✗ manquant',
  };

  for (const [key, value] of Object.entries(vars)) {
    const color = value?.includes('✗') ? 'red' : 'green';
    log(`  ${key}: ${value}`, color);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    log('\n❌ Variables manquantes. Impossible de continuer.', 'red');
    process.exit(1);
  }

  // 2. Tester la connexion Supabase
  log('\n🔌 Test connexion Supabase:', 'blue');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    // Test simple: récupérer la session (devrait être null)
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      log(`  ✗ Erreur session: ${sessionError.message}`, 'red');
    } else {
      log('  ✓ Connexion Supabase OK', 'green');
    }
  } catch (error: any) {
    log(`  ✗ Erreur connexion: ${error.message}`, 'red');
  }

  // 3. Tester la création d'utilisateur
  log('\n👤 Test création utilisateur:', 'blue');
  
  const testEmail = process.env.TEST_USER_EMAIL!;
  const testPassword = process.env.TEST_USER_PASSWORD!;

  // D'abord essayer de se connecter
  log(`  Tentative connexion: ${testEmail}`, 'yellow');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    log(`  ✗ Connexion échouée: ${signInError.message}`, 'red');
    
    // Essayer de créer l'utilisateur
    log(`  Tentative création utilisateur...`, 'yellow');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      log(`  ✗ Création échouée: ${signUpError.message}`, 'red');
      
      // Diagnostics supplémentaires
      log('\n💡 Solutions possibles:', 'yellow');
      
      if (signUpError.message.includes('invalid')) {
        log('  1. L\'email est rejeté par Supabase', 'yellow');
        log('     → Dashboard Supabase > Auth > Providers > Email', 'yellow');
        log('     → Désactiver "Confirm email" pour les tests', 'yellow');
        log('     → Ou utiliser un vrai email dans .env.test', 'yellow');
      }
      
      if (signUpError.message.includes('already registered')) {
        log('  1. L\'utilisateur existe déjà mais le mot de passe est incorrect', 'yellow');
        log('     → Dashboard Supabase > Auth > Users', 'yellow');
        log('     → Supprimer l\'utilisateur et réessayer', 'yellow');
      }

      log('\n  2. Créer l\'utilisateur manuellement:', 'yellow');
      log('     → Dashboard Supabase > Authentication > Users > Add user', 'yellow');
      log(`     → Email: ${testEmail}`, 'yellow');
      log(`     → Password: ${testPassword}`, 'yellow');
      log('     → Cocher "Auto Confirm User"', 'yellow');

    } else {
      if (signUpData.user?.identities?.length === 0) {
        log('  ⚠ Utilisateur créé mais email déjà utilisé (identities vide)', 'yellow');
      } else if (signUpData.session) {
        log('  ✓ Utilisateur créé et connecté!', 'green');
        log(`    Token: ${signUpData.session.access_token.substring(0, 30)}...`, 'green');
      } else {
        log('  ⚠ Utilisateur créé mais confirmation email requise', 'yellow');
        log('    → Dashboard Supabase > Auth > Providers > Email', 'yellow');
        log('    → Désactiver "Confirm email"', 'yellow');
        log('    → Ou confirmer manuellement dans Users', 'yellow');
      }
    }
  } else {
    log('  ✓ Connexion réussie!', 'green');
    log(`    User ID: ${signInData.user?.id}`, 'green');
    log(`    Token: ${signInData.session?.access_token.substring(0, 30)}...`, 'green');
  }

  // 4. Test avec Service Role (admin)
  log('\n🔑 Test Service Role:', 'blue');
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      // Lister les utilisateurs (nécessite service role)
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        log(`  ✗ Erreur: ${usersError.message}`, 'red');
      } else {
        log(`  ✓ Service Role OK - ${users.users.length} utilisateurs trouvés`, 'green');
        
        // Chercher notre utilisateur de test
        const testUser = users.users.find(u => u.email === testEmail);
        if (testUser) {
          log(`    ✓ Utilisateur test trouvé: ${testUser.email}`, 'green');
          log(`      ID: ${testUser.id}`, 'green');
          log(`      Confirmé: ${testUser.email_confirmed_at ? 'Oui' : 'Non'}`, testUser.email_confirmed_at ? 'green' : 'yellow');
        } else {
          log(`    ✗ Utilisateur test non trouvé: ${testEmail}`, 'yellow');
        }
      }
    } catch (error: any) {
      log(`  ✗ Erreur: ${error.message}`, 'red');
    }
  } else {
    log('  ⚠ SUPABASE_SERVICE_ROLE_KEY non défini', 'yellow');
  }

  log('\n' + '='.repeat(50), 'blue');
  log('Diagnostic terminé\n', 'bold');
}

main().catch(console.error);
