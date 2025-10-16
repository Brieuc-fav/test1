# 🚀 Déploiement sur Vercel

## 📋 Configuration des variables d'environnement

### Étapes :

1. **Connectez-vous à Vercel** : https://vercel.com/dashboard

2. **Importez votre repo GitHub** :
   - Click "Add New..." → "Project"
   - Sélectionnez `Brieuc-fav/test1`
   - Click "Import"

3. **Configurez les variables d'environnement** :
   - Avant de déployer, click "Environment Variables"
   - Ajoutez les 5 variables suivantes :

---

## 🔑 Variables à ajouter (Copier-Coller)

### 1. SUPABASE_URL
```
Key: SUPABASE_URL
Value: https://bodpqqoqrwzlscziflzt.supabase.co
```
✅ Cocher : Production, Preview, Development

---

### 2. SUPABASE_ANON_KEY
```
Key: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZHBxcW9xcnd6bHNjemlmbHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDM0NDYsImV4cCI6MjA3NDM3OTQ0Nn0.cKyvu47Y7_3gZHr-legtasZnl54oEfhpKblbWW9oT14
```
✅ Cocher : Production, Preview, Development

---

### 3. SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvZHBxcW9xcnd6bHNjemlmbHp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODgwMzQ0NiwiZXhwIjoyMDc0Mzc5NDQ2fQ.PaVkQsOvsHUJuv9DAQw6bme_YX82mTxoZVUc0En2COQ
```
✅ Cocher : Production, Preview, Development

---

### 4. AZURE_API_KEY
```
Key: AZURE_API_KEY
Value: YOUR_AZURE_API_KEY_HERE
```
✅ Cocher : Production, Preview, Development

---

### 5. AZURE_SORA_ENDPOINT
```
Key: AZURE_SORA_ENDPOINT
Value: https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
```
✅ Cocher : Production, Preview, Development

---

## 🎯 Après l'ajout des variables

1. **Click "Deploy"**
2. Attendez quelques minutes
3. Votre app sera disponible sur : `https://your-project.vercel.app`

---

## 🔧 Configuration Next.js (déjà faite)

Votre `next.config.js` est déjà configuré :
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
```

---

## 📦 Build Settings (automatiques)

Vercel détecte automatiquement :
- **Framework Preset** : Next.js
- **Build Command** : `npm run build`
- **Output Directory** : `.next`
- **Install Command** : `npm install`

---

## ✅ Vérification après déploiement

1. **Testez votre app** : `https://your-project.vercel.app`
2. **Vérifiez les logs** : Vercel Dashboard → Deployments → Logs
3. **Testez la génération de vidéo** :
   - Upload une image
   - Entrez un prompt
   - Vérifiez que Sora génère bien la vidéo

---

## 🐛 En cas d'erreur

### Erreur : "Missing environment variables"
- Vérifiez que TOUTES les 5 variables sont ajoutées
- Vérifiez qu'elles sont cochées pour "Production"
- Redéployez : Settings → Deployments → ... → Redeploy

### Erreur : "Sora API failed"
- Vérifiez que `AZURE_API_KEY` est correcte
- Vérifiez que `AZURE_SORA_ENDPOINT` est correcte
- Testez en local d'abord avec `npm run dev`

### Erreur : "Supabase connection failed"
- Vérifiez les 3 variables Supabase
- Vérifiez que les buckets existent dans Supabase
- Vérifiez les RLS policies

---

## 🚀 Commandes utiles

### Redéployer après changement de variables :
```bash
# Via l'interface Vercel
Settings → Environment Variables → Redeploy
```

### Logs en temps réel :
```bash
vercel logs your-deployment-url --follow
```

---

## 📊 Quotas et limites

### Vercel (Free Plan) :
- **Bandwidth** : 100 GB/mois
- **Serverless Function Execution** : 100 heures/mois
- **Serverless Function Duration** : 10 secondes max

⚠️ **Note** : Sora peut prendre 20-60 secondes pour générer une vidéo, ce qui dépasse la limite de 10s des fonctions serverless sur le plan gratuit.

### Solutions :
1. **Vercel Pro** : Augmente la limite à 60 secondes
2. **Architecture async** : Utiliser des webhooks (à implémenter)
3. **Polling côté client** : Créer le job, puis polling depuis le frontend

---

## 💡 Recommandation

Pour l'instant, testez avec :
1. **Vercel Pro** (20$/mois) pour 60s de timeout
2. Ou implémentez un système de polling côté client

---

## ✅ Checklist finale

Avant de déployer :
- ✅ Toutes les 5 variables d'environnement ajoutées
- ✅ Variables cochées pour Production, Preview, Development
- ✅ Code sans secrets hardcodés
- ✅ `.env.local` dans `.gitignore`
- ✅ Build local réussi (`npm run build`)
- ✅ Test local réussi (`npm run dev`)

**Prêt à déployer !** 🚀
