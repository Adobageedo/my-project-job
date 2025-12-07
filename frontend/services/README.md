# 📚 Documentation de l'architecture des services

## 🎯 Objectif

Cette architecture de services sépare complètement la logique métier des composants React, permettant :
- **Maintenabilité** : Code organisé et facile à maintenir
- **Testabilité** : Services facilement testables en isolation
- **Scalabilité** : Transition facile vers de vrais appels API
- **Réutilisabilité** : Mêmes services utilisables dans plusieurs composants

---

## 📁 Structure des services

```
services/
├── api/
│   ├── config.ts          # Configuration centrale (URLs, endpoints, mode mock)
│   └── client.ts          # Client HTTP générique avec gestion d'erreurs
├── authService.ts         # Authentification (login, register, logout)
├── candidatesService.ts   # Gestion des candidats
├── companiesService.ts    # Gestion des entreprises
├── offersService.ts       # Gestion des offres d'emploi
├── applicationsService.ts # Gestion des candidatures
├── adminService.ts        # Fonctionnalités admin (audit, RGPD, sync)
├── cvService.ts           # Parsing CV et upload
├── notificationsService.ts # Notifications et emails
├── index.ts               # Export centralisé
└── README.md              # Cette documentation
```

---

## 🚀 Utilisation dans les composants

### Import des services

```typescript
// Import simple depuis l'index centralisé
import { login, getAllOffers, createApplication } from '@/services';

// Ou import spécifique
import { login } from '@/services/authService';
import { getAllOffers } from '@/services/offersService';
```

### Exemples d'utilisation

#### 1. Authentification

```typescript
'use client';

import { useState } from 'react';
import { login, registerCandidate } from '@/services';

export default function LoginPage() {
  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password });
      console.log('User:', result.user);
      console.log('Token:', result.token);
      // Rediriger l'utilisateur
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <form>{/* ... */}</form>;
}
```

#### 2. Récupération des offres

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAllOffers, searchOffers } from '@/services';
import { JobOffer } from '@/types';

export default function OffersPage() {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const data = await getAllOffers();
        setOffers(data);
      } catch (error) {
        console.error('Error loading offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  const handleSearch = async (params: SearchOffersParams) => {
    const results = await searchOffers(params);
    setOffers(results);
  };

  return <div>{/* Afficher les offres */}</div>;
}
```

#### 3. Création de candidature

```typescript
'use client';

import { useState } from 'react';
import { createApplication } from '@/services';

export default function ApplyButton({ offerId, candidateId }) {
  const handleApply = async () => {
    try {
      const application = await createApplication({
        candidateId,
        offerId,
        coverLetter: 'Ma lettre de motivation...',
      });
      
      alert('Candidature envoyée avec succès !');
    } catch (error) {
      alert(error.message);
    }
  };

  return <button onClick={handleApply}>Postuler</button>;
}
```

#### 4. Parsing de CV

```typescript
'use client';

import { useState } from 'react';
import { uploadCV, parseCV } from '@/services';
import { CVParseResult } from '@/types';

export default function CVUploadComponent() {
  const [parsedData, setParsedData] = useState<CVParseResult | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      // Upload du fichier
      const uploadResult = await uploadCV(file);
      console.log('File uploaded:', uploadResult.url);

      // Parse avec IA
      const parsed = await parseCV(file);
      setParsedData(parsed);
      
      // Pré-remplir le formulaire avec les données
      console.log('Parsed:', parsed);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <div>{/* Dropzone */}</div>;
}
```

---

## ⚙️ Configuration

### Mode Mock vs Production

Le fichier `services/api/config.ts` contient un flag `USE_MOCK`:

```typescript
export const API_CONFIG = {
  USE_MOCK: true, // true = données mockées, false = vraies API
  MOCK_DELAY: 800, // Délai simulé en ms
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
};
```

**En développement (mock)** :
- `USE_MOCK: true`
- Les services retournent des données mockées
- Simulation de latence réseau avec `MOCK_DELAY`

**En production (vraies API)** :
- `USE_MOCK: false`
- Les services utilisent `apiClient` pour appeler le backend
- Variables d'environnement requises

### Variables d'environnement

Créer un fichier `.env.local` :

```env
# Backend API
NEXT_PUBLIC_API_URL=https://api.financestages.fr

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Mode (optionnel, par défaut true en dev)
NEXT_PUBLIC_USE_MOCK=false
```

---

## 🔄 Transition vers vraies API

### Étape 1 : Implémenter le backend

Sur Railway, créer les endpoints correspondants :
- `POST /api/auth/login`
- `GET /api/offers`
- `POST /api/applications`
- etc.

### Étape 2 : Activer le mode production

Dans `services/api/config.ts` :

```typescript
export const API_CONFIG = {
  USE_MOCK: false, // Désactiver le mode mock
  BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  // ...
};
```

### Étape 3 : Aucun changement dans les composants !

Les composants continuent d'utiliser les mêmes services :

```typescript
// Aucun changement nécessaire
const offers = await getAllOffers();
```

Le service gère automatiquement le switch entre mock et API :

```typescript
export const getAllOffers = async (): Promise<JobOffer[]> => {
  if (API_CONFIG.USE_MOCK) {
    await delay();
    return [...mockJobOffers]; // Mode mock
  }
  
  // Mode production : appel API
  return apiClient.get<JobOffer[]>(API_CONFIG.ENDPOINTS.OFFERS);
};
```

---

## 🧪 Tests

### Tester un service

```typescript
// tests/services/offersService.test.ts
import { getAllOffers, getOfferById } from '@/services';

describe('OffersService', () => {
  it('should get all offers', async () => {
    const offers = await getAllOffers();
    expect(offers).toHaveLength(15);
  });

  it('should get offer by id', async () => {
    const offer = await getOfferById('1');
    expect(offer).toBeDefined();
    expect(offer?.id).toBe('1');
  });
});
```

---

## 📊 Services disponibles

### AuthService
- `login(credentials)` - Connexion
- `registerCandidate(data)` - Inscription candidat
- `registerCompany(data)` - Inscription entreprise
- `logout()` - Déconnexion
- `getCurrentUser()` - Utilisateur connecté
- `isAuthenticated()` - Vérifier l'authentification

### OffersService
- `getAllOffers()` - Toutes les offres
- `getOfferById(id)` - Offre par ID
- `searchOffers(params)` - Recherche avec filtres
- `getOffersByCompany(companyId)` - Offres d'une entreprise
- `createOffer(data)` - Créer une offre
- `updateOffer(data)` - Modifier une offre
- `deleteOffer(id)` - Supprimer une offre
- `getRecentOffers(limit)` - Offres récentes

### ApplicationsService
- `getAllApplications()` - Toutes les candidatures
- `getApplicationsByCandidate(id)` - Candidatures d'un candidat
- `getApplicationsByCompany(id)` - Candidatures d'une entreprise
- `createApplication(data)` - Créer une candidature
- `updateApplicationStatus(id, status)` - Changer le statut
- `getApplicationsGroupedByStatus(id)` - Pour Kanban

### CandidatesService
- `getAllCandidates()` - Tous les candidats
- `getCandidateById(id)` - Candidat par ID
- `updateCandidate(data)` - Modifier le profil
- `searchCandidates(query)` - Recherche (CVthèque)

### CompaniesService
- `getAllCompanies()` - Toutes les entreprises
- `getCompanyById(id)` - Entreprise par ID
- `updateCompany(data)` - Modifier le profil
- `searchCompanies(query)` - Recherche

### CVService
- `uploadCV(file)` - Upload CV
- `parseCV(file)` - Parser CV avec IA
- `parseJobOfferPDF(file)` - Parser fiche de poste
- `deleteCV(url)` - Supprimer CV

### AdminService
- `getAdminStats()` - Statistiques globales
- `getAuditLogs(filters)` - Audit logs
- `exportAuditLogsCSV()` - Export CSV
- `getGDPRRequests()` - Demandes RGPD
- `updateGDPRRequestStatus(id, status)` - Traiter RGPD
- `getRecruitCRMSyncStatus()` - État sync CRM
- `triggerRecruitCRMSync()` - Lancer sync
- `suspendUser(id)` - Suspendre utilisateur

### NotificationsService
- `getNotificationSettings(userId)` - Paramètres
- `updateNotificationSettings(userId, settings)` - Modifier
- `sendEmail(data)` - Envoyer email
- `notifyNewApplication(...)` - Notification candidature
- `notifyNewOffer(...)` - Notification offre

---

## 🎨 Bonnes pratiques

### 1. Toujours utiliser try/catch

```typescript
try {
  const offers = await getAllOffers();
  setOffers(offers);
} catch (error) {
  console.error('Error:', error);
  setError('Impossible de charger les offres');
}
```

### 2. Gérer les états de chargement

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllOffers();
      setOffers(data);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### 3. Éviter les appels redondants

```typescript
// ❌ Mauvais : appel à chaque render
const offers = await getAllOffers();

// ✅ Bon : dans useEffect avec dépendances
useEffect(() => {
  getAllOffers().then(setOffers);
}, []);
```

### 4. Types TypeScript stricts

```typescript
import { JobOffer, SearchOffersParams } from '@/types';

const handleSearch = async (params: SearchOffersParams): Promise<JobOffer[]> => {
  return await searchOffers(params);
};
```

---

## 🔒 Sécurité

Les services gèrent automatiquement :
- ✅ Tokens d'authentification (stockés en localStorage)
- ✅ Headers CORS
- ✅ Gestion d'erreurs HTTP
- ✅ Timeout des requêtes (30s)

Pour ajouter l'authentification aux requêtes :

```typescript
// Dans apiClient.ts
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  ...options?.headers,
}
```

---

## 📖 Résumé

✅ **Services créés** : 10 services métier  
✅ **Mode mock activé** : Données simulées pour développement  
✅ **Prêt pour production** : Basculement facile vers vraies API  
✅ **Composants nettoyés** : Pas de mock data dans les composants  
✅ **Architecture scalable** : Ajout facile de nouveaux services  

**Prochaines étapes** :
1. Mettre à jour tous les composants pour utiliser les services
2. Implémenter le backend sur Railway
3. Configurer les variables d'environnement
4. Basculer `USE_MOCK: false`
