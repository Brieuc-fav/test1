# 🧪 GUIDE DE TEST - Système d'Abonnement Stripe

## 🎯 Objectif
Tester le flux complet du système d'abonnement et de quota.

---

## 📋 TESTS À EFFECTUER

### TEST 1 : Abonnement Gratuit Automatique
**Objectif** : Vérifier qu'un nouvel utilisateur reçoit automatiquement 50 générations gratuites

**Étapes :**
1. Créer un nouveau compte utilisateur
2. Aller sur la page d'accueil
3. Uploader une image et entrer un prompt
4. Cliquer sur "Générer"

**Résultat attendu :**
- ✅ La génération doit fonctionner
- ✅ Sur le dashboard, afficher "50 générations restantes" devient "49 générations restantes"
- ✅ Dans Supabase, vérifier qu'une ligne a été créée dans `subscriptions` avec :
  - `quota_limit: 50`
  - `quota_used: 1`
  - `status: 'active'`

**Vérification dans Supabase :**
```sql
SELECT * FROM subscriptions WHERE user_id = 'votre-user-id';
-- Devrait afficher quota_limit=50, quota_used=1
```

---

### TEST 2 : Épuisement du Quota Gratuit
**Objectif** : Vérifier le blocage quand quota = 0

**Étapes :**
1. Dans Supabase, mettre manuellement le quota à la limite :
   ```sql
   UPDATE subscriptions 
   SET quota_used = 50 
   WHERE user_id = 'votre-user-id';
   ```
2. Rafraîchir la page d'accueil
3. Essayer de générer une vidéo

**Résultat attendu :**
- ✅ Message d'alerte : "Quota épuisé"
- ✅ Redirection automatique vers `/pricing`
- ✅ Sur le dashboard : Message "⚠️ Quota épuisé. Passez à un plan supérieur"
- ✅ La génération ne doit PAS se lancer

---

### TEST 3 : Achat Plan Basic (Mode Test)
**Objectif** : Tester le flux de paiement Stripe

**Étapes :**
1. Aller sur `/pricing`
2. Cliquer sur "S'abonner" du plan Basic (9€)
3. Sur la page Stripe Checkout :
   - Email : votre@email.com
   - Carte : `4242 4242 4242 4242`
   - Date : N'importe quelle date future (ex: 12/25)
   - CVC : `123`
4. Valider le paiement

**Résultat attendu :**
- ✅ Redirection vers `/dashboard?success=true`
- ✅ Sur le dashboard : Afficher "Plan Basic"
- ✅ Quota réinitialisé à "0 / 50"
- ✅ Badge "Actif"

**Vérification dans Supabase :**
```sql
SELECT * FROM subscriptions WHERE user_id = 'votre-user-id';
-- Devrait avoir :
-- stripe_customer_id: 'cus_...'
-- stripe_subscription_id: 'sub_...'
-- stripe_price_id: 'price_1SIsn6...'
-- quota_limit: 50
-- quota_used: 0
-- status: 'active'
```

**Vérification dans Stripe Dashboard :**
- Aller sur https://dashboard.stripe.com/test/subscriptions
- Vérifier qu'un nouvel abonnement apparaît

---

### TEST 4 : Achat Plan Pro (Mode Test)
**Objectif** : Tester le plan Pro avec 200 générations

**Étapes :**
1. Aller sur `/pricing`
2. Cliquer sur "S'abonner" du plan Pro (20€)
3. Utiliser la carte de test `4242 4242 4242 4242`
4. Valider

**Résultat attendu :**
- ✅ Dashboard affiche "Plan Pro"
- ✅ Quota : "0 / 200"
- ✅ Badge "Actif"

**Vérification dans Supabase :**
```sql
SELECT * FROM subscriptions WHERE user_id = 'votre-user-id';
-- quota_limit: 200
-- stripe_price_id: 'price_1SIsqo...'
```

---

### TEST 5 : Génération avec Abonnement Actif
**Objectif** : Vérifier que le quota s'incrémente correctement

**Étapes :**
1. Avoir un abonnement actif (Basic ou Pro)
2. Générer 3 vidéos successivement
3. Vérifier le quota après chaque génération

**Résultat attendu :**
- ✅ Après vidéo 1 : "1 / 50 (ou 200) générations utilisées"
- ✅ Après vidéo 2 : "2 / 50 (ou 200) générations utilisées"
- ✅ Après vidéo 3 : "3 / 50 (ou 200) générations utilisées"
- ✅ Barre de progression augmente visuellement
- ✅ Page d'accueil affiche aussi le quota mis à jour

---

### TEST 6 : Portal de Gestion d'Abonnement
**Objectif** : Tester le portail client Stripe

**Étapes :**
1. Sur le dashboard, cliquer sur "Gérer l'abonnement"
2. Vérifier que le portail Stripe s'ouvre
3. Explorer les options disponibles

**Résultat attendu :**
- ✅ Redirection vers le portail Stripe
- ✅ Affichage de l'abonnement actuel
- ✅ Options disponibles :
  - Changer de plan (Basic ↔ Pro)
  - Mettre à jour la carte bancaire
  - Voir l'historique des factures
  - Annuler l'abonnement
- ✅ Bouton retour vers le dashboard

---

### TEST 7 : Changement de Plan (Basic → Pro)
**Objectif** : Tester le changement de plan

**Étapes :**
1. Avoir un abonnement Basic actif
2. Aller dans le portail Stripe
3. Changer pour le plan Pro
4. Confirmer

**Résultat attendu :**
- ✅ Webhook `customer.subscription.updated` reçu
- ✅ Dashboard affiche "Plan Pro"
- ✅ Quota mis à jour : "X / 200"
- ✅ `stripe_price_id` mis à jour dans Supabase

**Vérification dans les logs :**
```
✅ Abonnement mis à jour: sub_...
```

---

### TEST 8 : Annulation d'Abonnement
**Objectif** : Tester l'annulation

**Étapes :**
1. Dans le portail Stripe, annuler l'abonnement
2. Confirmer l'annulation
3. Vérifier le dashboard

**Résultat attendu :**
- ✅ Webhook `customer.subscription.deleted` reçu
- ✅ Badge "canceled" sur le dashboard
- ✅ Message : "Abonnement annulé"
- ✅ Impossible de générer de nouvelles vidéos
- ✅ Status = 'canceled' dans Supabase

---

### TEST 9 : Webhook - Réinitialisation du Quota Mensuel
**Objectif** : Simuler le renouvellement mensuel

**Étapes :**
1. Avoir un abonnement actif avec quota utilisé (ex: 30/50)
2. Simuler l'événement `invoice.payment_succeeded` :
   ```bash
   # Via Stripe CLI
   stripe trigger invoice.payment_succeeded
   ```

**Résultat attendu :**
- ✅ Webhook reçu et traité
- ✅ `quota_used` réinitialisé à 0
- ✅ Dashboard affiche "0 / 50" (ou 200)
- ✅ Log : "✅ Quota réinitialisé après paiement"

---

### TEST 10 : Interface Page d'Accueil avec Quota
**Objectif** : Vérifier l'affichage en temps réel

**Étapes :**
1. Être connecté avec un abonnement actif
2. Aller sur la page d'accueil
3. Observer l'affichage du quota

**Résultat attendu :**
- ✅ Card bleue "Quota mensuel" visible
- ✅ Affichage : "X / Y générations utilisées"
- ✅ Barre de progression proportionnelle
- ✅ Nombre de générations restantes affiché
- ✅ Si quota épuisé : Message d'alerte rouge

---

## 🛠️ OUTILS DE TEST

### 1. Stripe CLI (pour tester les webhooks en local)
```bash
# Installation
npm install -g stripe

# Login
stripe login

# Écouter les webhooks en local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Dans un autre terminal, déclencher des événements
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### 2. Cartes de Test Stripe
```
# Paiement réussi
4242 4242 4242 4242

# Paiement refusé
4000 0000 0000 0002

# 3D Secure requis
4000 0027 6000 3184

# Date : N'importe quelle date future
# CVC : N'importe quel 3 chiffres
```

### 3. Requêtes SQL Utiles

**Voir tous les abonnements :**
```sql
SELECT 
  id,
  user_id,
  stripe_price_id,
  status,
  quota_limit,
  quota_used,
  created_at
FROM subscriptions
ORDER BY created_at DESC;
```

**Réinitialiser le quota d'un user :**
```sql
UPDATE subscriptions 
SET quota_used = 0 
WHERE user_id = 'votre-user-id';
```

**Simuler quota épuisé :**
```sql
UPDATE subscriptions 
SET quota_used = quota_limit 
WHERE user_id = 'votre-user-id';
```

**Supprimer un abonnement (pour retester) :**
```sql
DELETE FROM subscriptions 
WHERE user_id = 'votre-user-id';
```

---

## 📊 CHECKLIST DE TEST

Cochez au fur et à mesure :

- [ ] TEST 1 : Abonnement gratuit automatique
- [ ] TEST 2 : Épuisement du quota
- [ ] TEST 3 : Achat Plan Basic
- [ ] TEST 4 : Achat Plan Pro
- [ ] TEST 5 : Génération avec incrémentation quota
- [ ] TEST 6 : Portal de gestion
- [ ] TEST 7 : Changement de plan
- [ ] TEST 8 : Annulation d'abonnement
- [ ] TEST 9 : Réinitialisation quota mensuel (webhook)
- [ ] TEST 10 : Interface utilisateur temps réel

---

## 🐛 PROBLÈMES CONNUS ET SOLUTIONS

### Problème : Webhook non reçu en local
**Solution :**
```bash
# Utiliser Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copier le webhook secret affiché et le mettre dans .env.local
```

### Problème : Erreur "Quota épuisé" mais quota_used < quota_limit
**Solution :**
```sql
-- Vérifier le status de l'abonnement
SELECT status, quota_used, quota_limit FROM subscriptions WHERE user_id = 'xxx';
-- Le status doit être 'active' ou null
```

### Problème : Quota ne s'incrémente pas
**Solution :**
- Vérifier les logs serveur : `console.log` dans `app/api/generate/route.ts`
- Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est bien définie
- Vérifier les permissions RLS sur la table `subscriptions`

---

## ✅ VALIDATION FINALE

Une fois tous les tests passés :

1. ✅ Nouveau user → 50 générations gratuites
2. ✅ Achat Basic → 50 générations payantes
3. ✅ Achat Pro → 200 générations
4. ✅ Quota s'incrémente correctement
5. ✅ Blocage si quota épuisé
6. ✅ Webhooks fonctionnent
7. ✅ Portal de gestion accessible
8. ✅ Interface utilisateur claire

**Le système est prêt pour la production ! 🚀**

---

**Dernière mise à jour** : 22 octobre 2025
