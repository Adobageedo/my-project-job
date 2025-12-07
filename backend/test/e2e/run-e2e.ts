#!/usr/bin/env ts-node
/**
 * Script pour lancer les tests E2E manuellement
 * Usage: npx ts-node test/e2e/run-e2e.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.test' });

const BASE_URL = `http://localhost:${process.env.PORT || 3001}/api/v1`;

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

// Couleurs pour le terminal
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

async function getToken(): Promise<string> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  });

  if (error) {
    // Essayer de créer l'utilisateur
    log('Creating test user...', 'yellow');
    const { error: signUpError } = await supabase.auth.signUp({
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    });

    if (signUpError) {
      throw new Error(`Cannot create test user: ${signUpError.message}`);
    }

    // Réessayer la connexion
    const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    });

    if (retryError) {
      throw new Error(`Cannot login: ${retryError.message}`);
    }

    return retryData.session!.access_token;
  }

  return data.session!.access_token;
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start,
    });
    log(`  ✓ ${name} (${Date.now() - start}ms)`, 'green');
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error.message,
    });
    log(`  ✗ ${name} (${Date.now() - start}ms)`, 'red');
    log(`    Error: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n🧪 E2E Tests - Backend FinanceStages\n', 'bold');
  log(`📍 Base URL: ${BASE_URL}`, 'blue');

  // Vérifier les variables d'environnement
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    log('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.test', 'red');
    process.exit(1);
  }

  let token: string;

  // ========================================
  // Test: Get Token
  // ========================================
  log('\n📦 Authentication', 'blue');
  
  await runTest('Get Supabase token', async () => {
    token = await getToken();
    if (!token) throw new Error('No token received');
    log(`    Token: ${token.substring(0, 20)}...`, 'yellow');
  });

  // ========================================
  // Test: Health Check
  // ========================================
  log('\n📦 Health Check', 'blue');

  await runTest('GET /health - should return ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    
    const body = await res.json();
    if (body.status !== 'ok') throw new Error(`Status is not ok: ${body.status}`);
    if (body.database !== 'supabase') throw new Error(`Database is not supabase: ${body.database}`);
  });

  // ========================================
  // Test: AI Parsing (si OpenAI configuré)
  // ========================================
  if (process.env.OPENAI_API_KEY) {
    log('\n📦 AI Parsing', 'blue');

    await runTest('POST /ai-parsing/cv - without token should return 401', async () => {
      const res = await fetch(`${BASE_URL}/ai-parsing/cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test CV', format: 'text' }),
      });
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    await runTest('POST /ai-parsing/cv - with token should parse CV', async () => {
      const res = await fetch(`${BASE_URL}/ai-parsing/cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: `
            Marie Dupont
            Email: marie.dupont@email.com
            M2 Finance, HEC Paris
            Compétences: Python, Excel, VBA
          `,
          format: 'text',
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Status: ${res.status}, Error: ${error}`);
      }

      const body = await res.json();
      if (typeof body !== 'object') throw new Error('Response is not an object');
    });

    await runTest('POST /ai-parsing/job-offer - should parse job offer', async () => {
      const res = await fetch(`${BASE_URL}/ai-parsing/job-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: `
            Stage Analyste M&A - 6 mois
            Goldman Sachs - Paris
            Profil: M2 Finance
            Missions: Analyse financière, Modélisation
          `,
          format: 'text',
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Status: ${res.status}, Error: ${error}`);
      }

      const body = await res.json();
      if (typeof body !== 'object') throw new Error('Response is not an object');
    });
  } else {
    log('\n⚠️  Skipping AI Parsing tests (OPENAI_API_KEY not set)', 'yellow');
  }

  // ========================================
  // Summary
  // ========================================
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Results Summary\n', 'bold');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  log(`  Total:  ${results.length} tests`, 'blue');
  log(`  Passed: ${passed}`, 'green');
  if (failed > 0) {
    log(`  Failed: ${failed}`, 'red');
  }
  log(`  Time:   ${totalDuration}ms\n`, 'blue');

  if (failed > 0) {
    log('❌ Some tests failed!', 'red');
    process.exit(1);
  } else {
    log('✅ All tests passed!', 'green');
    process.exit(0);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
