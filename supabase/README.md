# 🗄️ Configuration Supabase

Ce guide explique comment configurer Supabase pour la plateforme Finance Internship.

## 📋 Prérequis

1. Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
2. Un projet Supabase créé

## 🚀 Installation

### 1. Créer le projet Supabase

1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquez sur "New Project"
3. Choisissez un nom et une région (EU pour RGPD)
4. Notez le mot de passe de la base de données

### 2. Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Copiez le contenu de `schema.sql`
3. Exécutez le script

### 3. Configurer les Storage Buckets

Dans **Storage**, créez ces buckets :

| Bucket | Public | MIME Types | Max Size |
|--------|--------|------------|----------|
| `cvs` | Non | application/pdf | 5MB |
| `logos` | Oui | image/png, image/jpeg, image/webp | 2MB |
| `documents` | Non | application/pdf | 10MB |

### 4. Configurer l'authentification

Dans **Authentication > Providers** :

#### Email
- ✅ Activer "Email"
- ✅ Activer "Confirm email"

#### Google OAuth
1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer l'API Google+ 
3. Créer des identifiants OAuth 2.0
4. Ajouter l'URL de callback Supabase
5. Copier Client ID et Secret dans Supabase

#### LinkedIn OAuth
1. Créer une app sur [LinkedIn Developers](https://developer.linkedin.com)
2. Configurer les permissions (r_liteprofile, r_emailaddress)
3. Ajouter l'URL de callback Supabase
4. Copier Client ID et Secret dans Supabase

### 5. Configurer les variables d'environnement

Copiez `.env.local.example` vers `.env.local` :

```bash
cp .env.local.example .env.local
```

Remplissez les valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔒 Row Level Security (RLS)

Le schéma SQL inclut des politiques RLS pour :

### Candidats
- ✅ Voir/modifier son propre profil
- ✅ Les entreprises voient les candidats qui ont postulé

### Entreprises
- ✅ Voir/modifier son propre profil
- ✅ Tout le monde peut voir les entreprises (pour les offres)

### Offres
- ✅ Tout le monde voit les offres actives
- ✅ Les entreprises gèrent leurs propres offres

### Candidatures
- ✅ Les candidats voient leurs candidatures
- ✅ Les entreprises voient les candidatures reçues
- ✅ Les entreprises peuvent changer le statut

### Audit Logs
- ✅ Seuls les admins peuvent voir
- ✅ Tout le monde peut insérer (tracking)

## 📊 Tables créées

| Table | Description |
|-------|-------------|
| `candidates` | Profils des candidats |
| `companies` | Profils des entreprises |
| `job_offers` | Offres d'emploi |
| `applications` | Candidatures |
| `audit_logs` | Logs d'audit |
| `gdpr_requests` | Demandes RGPD |
| `notification_settings` | Paramètres notifications |
| `recruit_crm_sync` | Tracking synchronisation CRM |

## 🔄 Mode Mock vs Supabase

L'application détecte automatiquement le mode :

```typescript
// services/api/config.ts
USE_MOCK: !process.env.NEXT_PUBLIC_SUPABASE_URL
```

- **Sans variables env** → Mode mock (données simulées)
- **Avec variables env** → Mode Supabase (vraie DB)

## 🧪 Tester la connexion

```typescript
import { supabase, isSupabaseConfigured } from '@/services';

// Vérifier si Supabase est configuré
console.log('Supabase ready:', isSupabaseConfigured());

// Tester une requête
const { data, error } = await supabase
  .from('job_offers')
  .select('*')
  .limit(1);

console.log('Test query:', { data, error });
```

## 📝 Commandes utiles

```bash
# Générer les types TypeScript depuis Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > services/supabase/types.ts

# Lancer Supabase en local (optionnel)
npx supabase start

# Appliquer les migrations
npx supabase db push
```

## 🔗 Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ⚠️ Sécurité

- ✅ Ne commitez jamais `.env.local`
- ✅ Utilisez la clé `anon` côté client (pas la clé `service_role`)
- ✅ Activez RLS sur toutes les tables
- ✅ Vérifiez les politiques avant la production
