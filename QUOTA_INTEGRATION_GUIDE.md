# 🎯 Système de Quota et d'Abonnement - Guide d'Intégration

## ✅ Fonctionnalités Implémentées

### 1. **Vérification automatique du quota**
Avant chaque génération de vidéo, le système vérifie :
- ✅ Si l'utilisateur a un abonnement
- ✅ Si le quota n'est pas dépassé
- ✅ Si l'abonnement est actif

### 2. **Création automatique d'abonnement gratuit**
- Lors de la première génération, un abonnement gratuit de 50 générations est créé automatiquement
- Quota par défaut : 50 générations/mois

### 3. **Incrémentation du quota**
- Après chaque génération réussie, le compteur `quota_used` est incrémenté
- Le quota est sauvegardé dans la table `subscriptions`

### 4. **Affichage en temps réel**
- **Page d'accueil** : Affiche le quota restant pour les utilisateurs connectés
- **Dashboard** : Affiche le plan actuel, quota utilisé et une barre de progression
- Mise à jour automatique après chaque génération

### 5. **Gestion des erreurs de quota**
- Message d'erreur clair quand le quota est épuisé
- Redirection automatique vers `/pricing` pour upgrade
- Empêche la génération si quota = 0

## 📂 Fichiers Modifiés

### Backend
1. **`app/api/generate/route.ts`**
   - Ajout de la vérification du quota avant génération
   - Création automatique d'abonnement gratuit si nécessaire
   - Incrémentation du quota après génération réussie

### Frontend
2. **`app/page.tsx`**
   - Affichage du quota restant en temps réel
   - Gestion des erreurs de quota avec redirection
   - Rechargement du quota après génération

3. **`app/dashboard/page.tsx`**
   - Affichage du plan d'abonnement
   - Barre de progression du quota
   - Bouton "Gérer l'abonnement"

### Helpers
4. **`lib/subscription.ts`**
   - `canGenerateVideo()` - Vérifie si l'utilisateur peut générer
   - `incrementQuotaUsed()` - Incrémente le compteur
   - `createFreeSubscription()` - Crée un abonnement gratuit
   - `getUserSubscription()` - Récupère l'abonnement
   - `resetQuota()` - Réinitialise le quota

## 🎬 Flux de Génération avec Quota

```
1. Utilisateur clique sur "Générer"
   ↓
2. API vérifie l'authentification
   ↓
3. API vérifie le quota via canGenerateVideo()
   ↓
   ├─ Pas d'abonnement → Créer abonnement gratuit (50 générations)
   ├─ Quota OK → Continuer
   └─ Quota épuisé → Erreur 403 + redirection vers /pricing
   ↓
4. Génération de la vidéo avec Sora
   ↓
5. Incrémentation du quota via incrementQuotaUsed()
   ↓
6. Retour de la vidéo + mise à jour UI
```

## 🔧 Configuration Base de Données

### Table `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT,
  current_period_end TIMESTAMP,
  quota_limit INTEGER DEFAULT 50,
  quota_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Quotas par Plan
- **Gratuit** : 50 générations/mois
- **Basic (9€)** : 50 générations/mois
- **Pro (20€)** : 200 générations/mois

## 📊 Exemples d'Utilisation

### Vérifier si un utilisateur peut générer
```typescript
import { canGenerateVideo } from '@/lib/subscription';

const canGenerate = await canGenerateVideo(userId);
if (!canGenerate) {
  // Quota épuisé ou abonnement inactif
}
```

### Incrémenter le quota après génération
```typescript
import { incrementQuotaUsed } from '@/lib/subscription';

// Après génération réussie
const updated = await incrementQuotaUsed(userId);
```

### Créer un abonnement gratuit
```typescript
import { createFreeSubscription } from '@/lib/subscription';

const subscription = await createFreeSubscription(userId);
```

## 🎨 Composants UI

### Affichage du Quota (Page d'accueil)
```tsx
{user && subscription && (
  <div className="quota-display">
    <p>{subscription.quota_used} / {subscription.quota_limit} utilisées</p>
    <progress value={subscription.quota_used} max={subscription.quota_limit} />
  </div>
)}
```

### Barre de Progression (Dashboard)
```tsx
<div className="quota-bar">
  <div style={{ width: `${(quota_used / quota_limit) * 100}%` }} />
</div>
```

## 🚀 Prochaines Étapes

### 1. Tester le flux complet
```bash
# 1. Se connecter avec un utilisateur
# 2. Générer une vidéo → Vérifie création abonnement gratuit
# 3. Vérifier le quota sur le dashboard
# 4. Générer jusqu'à épuisement du quota
# 5. Tester la redirection vers /pricing
```

### 2. Configurer le Webhook Stripe
- Le webhook réinitialisera automatiquement le quota chaque mois
- À configurer dans le Stripe Dashboard

### 3. Ajouter des notifications
- Email quand quota atteint 80%
- Email quand quota épuisé
- Notification in-app

## 🐛 Debug & Logs

Le système log toutes les étapes :
```
🔍 Checking user quota...
✅ Quota OK, proceeding with generation...
📊 Incrementing quota for user: xxx
✅ Quota incremented successfully
```

Vérifier les logs dans la console pour diagnostiquer les problèmes.

## 📝 Notes Importantes

1. **Abonnement gratuit automatique** : Créé lors de la première génération
2. **Quota réinitialisé** : Via webhook Stripe lors du renouvellement mensuel
3. **Vérification côté serveur** : Toutes les vérifications sont faites en backend pour la sécurité
4. **Mise à jour en temps réel** : Le quota s'affiche immédiatement après chaque génération

## ✅ Checklist de Déploiement

- [x] Vérification du quota implémentée
- [x] Création automatique d'abonnement gratuit
- [x] Incrémentation du quota après génération
- [x] Affichage du quota sur la page d'accueil
- [x] Affichage du plan sur le dashboard
- [x] Gestion des erreurs de quota
- [ ] Configuration du webhook Stripe (à faire)
- [ ] Tests end-to-end (à faire)
- [ ] Notifications email (optionnel)

---

**Date de création** : 22 octobre 2025  
**Status** : ✅ Implémenté et fonctionnel
