# 🚀 FinanceStages Backend API

Backend NestJS production-ready pour la plateforme FinanceStages avec parsing IA, synchronisation RecruitCRM et envoi d'emails.

## 📋 Table des Matières

- [Stack Technique](#stack-technique)
- [Architecture](#architecture)
- [Installation Locale](#installation-locale)
- [Variables d'Environnement](#variables-denvironnement)
- [Déploiement sur Railway](#déploiement-sur-railway)
- [API Documentation](#api-documentation)
- [Tests](#tests)
- [Scripts Disponibles](#scripts-disponibles)

---

## 🛠 Stack Technique

- **Framework**: NestJS 10
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL (via Prisma ORM)
- **Queue**: BullMQ + Redis
- **Validation**: Zod
- **Logging**: Pino
- **Documentation**: Swagger/OpenAPI
- **Tests**: Jest + Playwright
- **CI/CD**: GitHub Actions
- **Déploiement**: Railway

### Services Externes

- **OpenAI**: Parsing IA (GPT-4)
- **RecruitCRM**: Synchronisation bidirectionnelle
- **Resend**: Envoi d'emails transactionnels
- **Supabase**: Auth verification + DB (tables principales)

---

## 🏗 Architecture

```
backend/
├── src/
│   ├── main.ts                    # Point d'entrée
│   ├── app.module.ts              # Module racine
│   ├── config/
│   │   └── env.validation.ts      # Validation Zod des env
│   ├── common/
│   │   ├── logger/                # Logging Pino
│   │   ├── prisma/                # Prisma service
│   │   ├── supabase/              # Supabase client
│   │   ├── health/                # Health check endpoint
│   │   ├── guards/                # Auth guards
│   │   ├── interceptors/          # Logging, transform
│   │   ├── decorators/            # Custom decorators
│   │   └── utils/                 # Retry, circuit breaker
│   └── modules/
│       ├── ai-parsing/            # 🤖 Parsing IA (OpenAI)
│       │   ├── ai-parsing.controller.ts
│       │   ├── ai-parsing.service.ts
│       │   ├── providers/
│       │   │   ├── openai.provider.ts
│       │   │   └── ai.provider.interface.ts
│       │   ├── dto/
│       │   └── schemas/           # Zod schemas
│       ├── recruitcrm/            # 🔄 Sync RecruitCRM
│       │   ├── recruitcrm.controller.ts
│       │   ├── recruitcrm.service.ts
│       │   ├── recruitcrm-sync.service.ts
│       │   ├── webhooks.controller.ts
│       │   └── cron/
│       ├── email/                 # 📧 Emails (Resend)
│       │   ├── email.controller.ts
│       │   ├── email.service.ts
│       │   ├── email-queue.service.ts
│       │   ├── templates/         # Handlebars templates
│       │   └── processors/
│       └── admin/                 # 🔧 Admin endpoints
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
│   ├── e2e/                       # Tests E2E Playwright
│   └── jest-e2e.json
├── .github/
│   └── workflows/
│       └── deploy.yml             # CI/CD Railway
├── Dockerfile
├── Procfile
└── package.json
```

---

## 💻 Installation Locale

### Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9

### Installation

```bash
# 1. Cloner et installer
cd backend
npm install

# 2. Copier et configurer .env
cp .env.example .env
# Éditer .env avec vos vraies clés API

# 3. Générer Prisma Client
npm run prisma:generate

# 4. Appliquer les migrations
npm run prisma:migrate

# 5. (Optionnel) Seed la DB
npm run db:seed

# 6. Démarrer en mode dev
npm run start:dev

# L'API est disponible sur http://localhost:3000/api/v1
# Swagger docs: http://localhost:3000/api/docs
```

---

## 🔐 Variables d'Environnement

### Obligatoires

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/financestages

# Supabase (Auth)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# RecruitCRM
RECRUITCRM_API_KEY=your-recruitcrm-api-key
RECRUITCRM_API_URL=https://api.recruitcrm.io/v1

# Resend
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Redis
REDIS_URL=redis://localhost:6379
```

### Optionnelles (avec valeurs par défaut)

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
OPENAI_MODEL=gpt-4-turbo-preview
# ... voir .env.example pour la liste complète
```

---

## 🚂 Déploiement sur Railway

### Option 1: Déploiement Direct (Node.js)

Railway détecte automatiquement Node.js et utilise le `Procfile`.

#### 1. Créer un projet Railway

```bash
# Via CLI
npm install -g @railway/cli
railway login
railway init

# Ou via Dashboard: https://railway.app/new
```

#### 2. Ajouter PostgreSQL

```bash
railway add postgresql

# Railway injecte automatiquement DATABASE_URL
```

#### 3. (Optionnel) Ajouter Redis

```bash
railway add redis

# Railway injecte automatiquement REDIS_URL
```

#### 4. Configurer les variables d'environnement

Via Railway Dashboard ou CLI:

```bash
railway variables set OPENAI_API_KEY=sk-xxx
railway variables set RESEND_API_KEY=re_xxx
railway variables set RECRUITCRM_API_KEY=xxx
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=xxx
railway variables set SUPABASE_JWT_SECRET=xxx
railway variables set NODE_ENV=production
```

#### 5. Déployer

```bash
# Depuis le dossier backend/
railway up

# Ou connecter votre repo GitHub et Railway déploiera automatiquement
```

#### 6. Exécuter les migrations

```bash
railway run npm run prisma:deploy
```

### Option 2: Déploiement via Docker

Railway peut construire depuis le Dockerfile.

```bash
# 1. S'assurer que Dockerfile est à la racine du projet
# 2. Railway détectera automatiquement le Dockerfile
# 3. Configurer les variables d'env comme ci-dessus
# 4. Deploy: git push → Railway build & deploy
```

### Healthcheck

Railway utilisera l'endpoint `/api/v1/health` pour vérifier que l'app fonctionne.

### Logs

```bash
# Voir les logs en temps réel
railway logs

# Ou via Railway Dashboard > Logs
```

### Domaine Personnalisé

```bash
# Générer un domaine Railway
railway domain

# Ou configurer un domaine custom via Dashboard
```

---

## 📚 API Documentation

### Swagger UI

En développement: http://localhost:3000/api/docs

### Endpoints Principaux

#### Health Check

```http
GET /api/v1/health
```

#### AI Parsing

```http
POST /api/v1/ai-parsing/cv
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "...",
  "format": "text" | "pdf"
}
```

```http
POST /api/v1/ai-parsing/job-offer
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "...",
  "format": "text" | "pdf"
}
```

#### RecruitCRM Sync

```http
POST /api/v1/recruitcrm/sync/candidates
Authorization: Bearer <admin-token>
```

```http
POST /api/v1/recruitcrm/webhook
Content-Type: application/json
X-Webhook-Signature: <signature>

{ ... webhook payload ... }
```

#### Emails

```http
POST /api/v1/email/send
Content-Type: application/json
Authorization: Bearer <token>

{
  "to": "user@example.com",
  "templateName": "application-received",
  "data": { ... }
}
```

---

## 🧪 Tests

### Tests Unitaires

```bash
# Lancer tous les tests
npm run test

# Mode watch
npm run test:watch

# Avec coverage
npm run test:cov
```

### Tests E2E

```bash
# Installer Playwright (première fois)
npx playwright install

# Lancer les tests E2E
npm run test:e2e
```

### Tests en CI

Les tests tournent automatiquement via GitHub Actions à chaque push.

---

## 📜 Scripts Disponibles

```bash
# Développement
npm run start:dev        # Mode watch avec hot-reload
npm run start:debug      # Mode debug

# Build & Production
npm run build            # Build l'application
npm run start:prod       # Démarrer en production

# Database (Prisma)
npm run prisma:generate  # Générer Prisma Client
npm run prisma:migrate   # Créer et appliquer migration
npm run prisma:deploy    # Appliquer migrations (prod)
npm run prisma:studio    # Interface UI Prisma
npm run db:seed          # Seed la database

# Qualité de Code
npm run lint             # Linter ESLint
npm run format           # Formater avec Prettier
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E
npm run test:cov         # Coverage

# Build & Deploy
npm run build            # Build TypeScript
```

---

## 🔧 Troubleshooting

### Erreur: "Cannot connect to database"

```bash
# Vérifier que PostgreSQL tourne
# Vérifier DATABASE_URL dans .env
# Tester la connexion:
npm run prisma:studio
```

### Erreur: "Redis connection refused"

```bash
# Vérifier que Redis tourne
redis-cli ping  # Devrait répondre PONG

# Ou utiliser Redis via Docker:
docker run -d -p 6379:6379 redis:alpine
```

### Erreur: "OpenAI API key invalid"

```bash
# Vérifier OPENAI_API_KEY dans .env
# Tester directement:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Tests E2E échouent

```bash
# S'assurer que l'API tourne
npm run start:dev

# Dans un autre terminal:
npm run test:e2e
```

---

## 📦 Structure des Modules

### Module AI Parsing

- **OpenAI Provider**: Abstraction pour appeler GPT-4
- **Provider Interface**: Permet d'ajouter d'autres IA facilement
- **Retry Logic**: 3 tentatives avec backoff exponentiel
- **Circuit Breaker**: Évite de surcharger l'API
- **Logging**: Toutes les requêtes loggées (coûts, tokens)

### Module RecruitCRM

- **Sync Service**: Synchronisation bidirectionnelle
- **Webhook Handler**: Réception des événements RecruitCRM
- **Rate Limiting**: Respect des limites API
- **State Management**: Suivi de l'état de sync dans Prisma
- **Cron Jobs**: Sync automatique toutes les 6h (configurable)

### Module Email

- **Resend Integration**: Envoi via Resend API
- **Template Engine**: Handlebars pour templates HTML
- **Queue System**: BullMQ pour envoi async + retries
- **Webhooks**: Gestion des bounces/deliveries
- **Logging**: Suivi de tous les envois

---

## 🤝 Contribution

### Workflow de Développement

```bash
# 1. Créer une branche
git checkout -b feature/nom-feature

# 2. Coder + tester
npm run test
npm run lint

# 3. Commit
git commit -m "feat: description"

# 4. Push + PR
git push origin feature/nom-feature
```

### Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Code Style**: ESLint + Prettier (auto-formatté)
- **Tests**: Coverage > 80%

---

## 📄 License

MIT

---

## 🆘 Support

- **Issues**: GitHub Issues
- **Docs**: `/api/docs` (Swagger)
- **Email**: support@financestages.fr

---

**Backend prêt pour la production ! 🎉**
