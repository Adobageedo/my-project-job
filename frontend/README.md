# 🎯 FinanceStages - Plateforme de Stages et Alternances en Finance

Plateforme complète dédiée aux offres de stages et alternances dans le secteur financier. Interface moderne avec fonctionnalités avancées : parsing IA, synchronisation CRM, gestion RGPD.

## ✨ Caractéristiques principales

- **Design élégant et minimaliste** - Typographie light, beaucoup d'espace blanc, palette sobre
- **3 interfaces complètes** - Candidat, Entreprise, Administrateur
- **Parsing IA automatique** - Extraction des données depuis CV et fiches de poste PDF
- **Kanban interactif** - Drag & drop pour gérer les candidatures
- **Synchronisation RecruiteCRM** - Sync bidirectionnelle automatique
- **Gestion RGPD complète** - Conformité avec audit logs et export CSV
- **Système de notifications** - Emails personnalisables via Resend
- **Rôles combinables** - Entreprise + RH + Manager
- **Responsive design** - Optimisé pour mobile, tablette et desktop
- **Animations fluides** - Transitions et hover effects

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🎨 Stack technique

- **Framework** : Next.js 16 (App Router)
- **Styling** : TailwindCSS v4
- **Language** : TypeScript
- **Icônes** : Lucide React
- **Police** : Inter (Google Fonts)
- **Drag & Drop** : @hello-pangea/dnd
- **Dates** : date-fns
- **Upload fichiers** : react-dropzone
- **Export CSV** : papaparse

## 🏗️ Architecture des services

Le projet utilise une **architecture en couches** séparant la logique métier des composants :

```
Frontend React (Composants)
        ↓
Services Layer (Business Logic)
        ↓
API Client (HTTP/Mock)
        ↓
Backend API (Railway + Supabase)
```

### Structure des services

```
services/
├── api/
│   ├── config.ts          # Configuration (URLs, mode mock)
│   └── client.ts          # Client HTTP avec gestion d'erreurs
├── authService.ts         # Authentification
├── candidatesService.ts   # Gestion candidats
├── companiesService.ts    # Gestion entreprises
├── offersService.ts       # Gestion offres
├── applicationsService.ts # Gestion candidatures
├── adminService.ts        # Admin (audit, RGPD, sync)
├── cvService.ts           # Parsing CV
├── notificationsService.ts # Notifications
└── index.ts               # Export centralisé
```

### Mode Mock (développement)

Actuellement configuré en **mode mock** pour développement :
- ✅ Pas de backend requis
- ✅ Données simulées réalistes
- ✅ Latence réseau simulée (800ms)
- ✅ Prêt pour démo

### Utilisation dans les composants

```typescript
import { getAllOffers, createApplication, login } from '@/services';

// Dans un composant
const loadOffers = async () => {
  const offers = await getAllOffers();
  setOffers(offers);
};
```

Voir [services/README.md](services/README.md) pour la documentation complète.

## 📂 Structure du projet

```
finance-internship-platform/
├── app/                      # Pages Next.js (App Router)
│   ├── page.tsx             # Page d'accueil
│   ├── login/               # Authentification
│   ├── register/            # Inscription (candidat/entreprise avec rôles)
│   ├── candidate/           # Espace candidat
│   │   ├── offers/          # Liste et détail des offres
│   │   ├── applications/    # Suivi des candidatures
│   │   └── profile/         # Profil candidat
│   ├── company/             # Espace entreprise
│   │   ├── dashboard/       # Dashboard entreprise
│   │   ├── applications/    # Kanban des candidatures
│   │   ├── offers/new/      # Publication d'offre avec parsing PDF
│   │   └── profile/         # Profil entreprise
│   ├── admin/               # Espace administrateur
│   │   ├── dashboard/       # Dashboard admin
│   │   ├── users/           # Gestion utilisateurs
│   │   ├── offers/          # Gestion offres
│   │   ├── audit-logs/      # Logs d'audit avec export CSV
│   │   ├── recruitcrm-sync/ # Synchronisation RecruiteCRM
│   │   └── gdpr/            # Gestion demandes RGPD
│   └── settings/
│       └── notifications/   # Paramètres notifications et mailing
├── components/              # Composants réutilisables
│   ├── NavBar.tsx
│   ├── Footer.tsx
│   ├── JobCard.tsx
│   ├── CandidateCard.tsx
│   ├── Badge.tsx
│   ├── Modal.tsx
│   ├── CVUpload.tsx         # Upload et parsing CV
│   ├── JobOfferPDFParser.tsx # Parsing fiche de poste
│   └── ApplicationKanban.tsx # Kanban drag & drop
├── services/                # Services métier (logique business)
│   ├── api/
│   │   ├── config.ts        # Configuration API
│   │   └── client.ts        # Client HTTP
│   ├── authService.ts
│   ├── candidatesService.ts
│   ├── companiesService.ts
│   ├── offersService.ts
│   ├── applicationsService.ts
│   ├── adminService.ts
│   ├── cvService.ts
│   ├── notificationsService.ts
│   ├── index.ts             # Export centralisé
│   └── README.md            # Documentation services
├── data/                    # Données mockées (utilisées par services)
│   ├── candidates.ts
│   ├── companies.ts
│   ├── jobOffers.ts
│   └── applications.ts
└── types/                   # Types TypeScript
    └── index.ts
```

## 🎨 Stack technique

- **Framework** : Next.js 16 (App Router)
- **Styling** : TailwindCSS v4
- **Language** : TypeScript
- **Icônes** : Lucide React
- **Police** : Inter (Google Fonts)

## 👥 Personas et parcours

### Candidat
- ✅ Inscription avec upload CV et parsing IA automatique
- ✅ Profil complet avec localisations multiples
- ✅ Date de disponibilité et rythme d'alternance
- ✅ Recherche d'offres avec filtres avancés
- ✅ Détail d'offre et candidature
- ✅ Suivi des candidatures avec statuts

### Entreprise / RH / Manager
- ✅ Inscription avec rôles combinables (Entreprise + RH + Manager)
- ✅ Dashboard avec statistiques temps réel
- ✅ Publication d'offre :
  - Option 1 : Upload PDF avec parsing IA
  - Option 2 : Génération automatique IA
  - Option 3 : Saisie manuelle
- ✅ **Kanban interactif** pour gérer les candidatures (drag & drop)
- ✅ Synchronisation automatique avec RecruiteCRM
- ✅ Gestion multi-profils RH/Manager

### Administrateur
- ✅ Dashboard global avec métriques
- ✅ Gestion des utilisateurs (suspension/activation)
- ✅ Gestion des offres
- ✅ **Audit Logs complets** avec export CSV
- ✅ **Synchronisation RecruiteCRM** (monitoring et configuration)
- ✅ **Gestion des demandes RGPD** (accès, rectification, effacement, export)
- ✅ Statistiques trafic & connexions

## 🎯 Fonctionnalités complètes

### 🤖 Intelligence Artificielle
- **Parsing CV automatique** : Extraction des données depuis PDF (nom, email, école, compétences...)
- **Parsing fiche de poste** : Pré-remplissage automatique des offres depuis PDF
- **Génération IA** : Création automatique de contenu pour les offres

### 📋 Gestion des candidatures
- **Kanban interactif** : Drag & drop entre colonnes (Nouvelles → En cours → Acceptées/Refusées)
- **Vue détaillée** : Informations complètes du candidat avec CV
- **Filtres avancés** : Par statut, date, niveau d'études
- **Tags et shortlists** : Organisation personnalisée

### 🔄 Synchronisation RecruiteCRM
- **Sync bidirectionnelle** : Comptes, candidats, offres, candidatures
- **Monitoring temps réel** : Statut de chaque synchronisation
- **Gestion des erreurs** : Retry automatique et logs détaillés
- **Configuration flexible** : Choix des entités et fréquence de sync

### 📧 Système de notifications
- **Emails personnalisables** : Via Resend depuis votre domaine
- **Types de notifications** :
  - Nouvelles candidatures
  - Nouvelles offres correspondant au profil
  - Changements de statut
- **Fréquence configurable** : Instantané, quotidien, hebdomadaire

### 🛡️ RGPD & Sécurité
- **Gestion des demandes** :
  - Droit d'accès (consultation des données)
  - Droit de rectification (modification)
  - Droit à l'effacement (suppression)
  - Export des données personnelles
- **Audit Logs complets** :
  - Toutes les actions sensibles tracées
  - Export CSV pour conformité
  - Filtres par date, utilisateur, action
  - Conservation des IP et métadonnées

### 👥 Système de rôles
- **Rôles combinables** : Une entreprise peut avoir plusieurs rôles
  - Entreprise : Gestion globale et publication
  - RH : Gestion candidatures et recrutement
  - Manager : Supervision et validation
- **Permissions adaptées** : Chaque rôle a ses accès spécifiques

### 📊 Tableaux de bord
- **Candidat** : Offres recommandées, candidatures en cours
- **Entreprise** : Statistiques candidatures, offres actives, taux de conversion
- **Admin** : Métriques globales, activité plateforme, gestion utilisateurs

### 🔍 Recherche avancée
- **Filtres multiples** : Localisation, niveau, type contrat, date
- **Localisations multiples** : Un candidat peut cibler plusieurs villes
- **Disponibilité** : Date de début souhaitée
- **Rythme d'alternance** : Configuration personnalisée

## 🎨 Design System

### Palette de couleurs
- **Primary** : Slate 900 (`#0f172a`)
- **Background** : White & Slate 50
- **Text** : Slate 600-900
- **Accents** : Subtils, badges colorés par statut

### Typographie
- **Headings** : font-light (300), grandes tailles
- **Body** : font-light (300), leading-relaxed
- **Police** : Inter

### Composants
- **Buttons** : Slate 900, hover effects, animations
- **Cards** : Bordures subtiles, hover border-slate-900
- **Inputs** : Focus ring blue-500
- **Navigation** : Border-bottom pour active state

## 📦 Déploiement sur Vercel

```bash
# Méthode 1 : Via GitHub (recommandé)
git init
git add .
git commit -m "Initial commit"
git push origin main

# Puis sur vercel.com/new, importer le repo

# Méthode 2 : Via CLI
npm i -g vercel
vercel login
vercel --prod
```

Configuration automatique détectée :
- Build Command : `next build`
- Output Directory : Next.js default
- Aucune variable d'environnement requise

## 🚀 Déploiement

### Frontend - Vercel
```bash
# Méthode CLI
npm i -g vercel
vercel login
vercel --prod
```
Variables d'environnement requises :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend - Railway (prévu)
API métier pour :
- Parsing IA des CV et fiches de poste
- Synchronisation RecruiteCRM
- Envoi d'emails via Resend
- Cron jobs de synchronisation

Variables d'environnement :
- `DATABASE_URL` (Supabase)
- `OPENAI_API_KEY`
- `RECRUITCRM_API_KEY`
- `RESEND_API_KEY`

### Base de données - Supabase
- PostgreSQL avec Row Level Security (RLS)
- Auth : Email + OAuth (Google/LinkedIn)
- Storage : CV en PDF
- Edge Functions : Webhooks

## 📝 Notes importantes

- ✅ **Mock frontend complet** : Données simulées pour démo
- ✅ **Prêt pour intégration backend** : Structure et types définis
- ✅ **Composants réutilisables** : Architecture modulaire
- ✅ **Design système cohérent** : Guidelines respectées
- ✅ **Responsive** : Mobile, tablette, desktop
- ✅ **Accessible** : Bonnes pratiques a11y
- ⚠️ **Backend à implémenter** : Railway + Supabase
- ⚠️ **APIs à connecter** : OpenAI, RecruiteCRM, Resend

## 🔧 Prochaines étapes (Backend)

### Phase 1 : Infrastructure
- [ ] Configurer Supabase (Auth + Database + Storage)
- [ ] Déployer backend sur Railway
- [ ] Implémenter RLS (Row Level Security)
- [ ] Configurer Resend pour le mailing

### Phase 2 : Fonctionnalités IA
- [ ] Intégrer OpenAI pour parsing CV
- [ ] Implémenter extraction PDF (fiche de poste)
- [ ] Tester et optimiser les prompts

### Phase 3 : Synchronisation
- [ ] Connecter API RecruiteCRM
- [ ] Implémenter sync bidirectionnelle
- [ ] Configurer cron jobs
- [ ] Gestion des erreurs et retry

### Phase 4 : RGPD & Sécurité
- [ ] Implémenter audit logs en DB
- [ ] Système de traitement demandes RGPD
- [ ] Export automatisé des données
- [ ] Validation email stricte + Captcha

## 🔗 Liens utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Resend Documentation](https://resend.com/docs)
- [RecruiteCRM API](https://docs.recruitcrm.io)
- [Lucide Icons](https://lucide.dev)

---

**Créé avec** ❤️ **pour démontrer une plateforme professionnelle complète**
