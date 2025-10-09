# 🔧 Guide de Dépannage - Video Magic

## Erreur: "Video generation failed: Unknown error"

Cette erreur indique que le job Sora a échoué sans message d'erreur détaillé. Voici comment diagnostiquer :

### 📋 Checklist de diagnostic

#### 1. Vérifier les variables d'environnement

```bash
# Dans le terminal du projet
cd C:\Users\brieu\Documents\HEC_AI\background_magic
node -e "console.log('AZURE_API_KEY:', process.env.AZURE_API_KEY ? 'SET' : 'NOT SET')"
```

✅ **Solution** : Assurez-vous que `.env.local` existe à la racine du projet avec :
```
AZURE_API_KEY=your_azure_api_key_here
AZURE_SORA_ENDPOINT=https://your-deployment.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
```

#### 2. Tester l'API directement

Exécutez le script de test :

```bash
cd C:\Users\brieu\Documents\HEC_AI\background_magic
node test-sora.js
```

Ce script va :
- Vérifier les variables d'environnement
- Faire un appel test à l'API Sora
- Afficher la réponse complète

#### 3. Vérifier les logs du serveur

Avec le nouveau code amélioré, vous devriez voir dans la console du serveur :
```
🎬 Sora - Creating video generation job...
🎬 Sora - Response status: XXX
🎬 Sora - Response body: {...}
```

Cherchez ces logs pour voir exactement ce que l'API Sora retourne.

### 🔍 Causes possibles

#### A. Clé API invalide ou expirée

**Symptômes** :
- Status HTTP: 401 ou 403
- Message: "Unauthorized" ou "Forbidden"

**Solution** :
1. Vérifiez que la clé API est correcte dans `.env.local`
2. Vérifiez dans Azure Portal que la clé est active
3. Si nécessaire, régénérez une nouvelle clé

#### B. Endpoint incorrect

**Symptômes** :
- Status HTTP: 404
- Message: "Not Found"

**Solution** :
Vérifiez l'URL de l'endpoint. Elle doit être :
```
https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
```

#### C. Modèle Sora non déployé

**Symptômes** :
- Status HTTP: 404 ou 400
- Message: "Model not found" ou "Deployment not found"

**Solution** :
1. Allez sur Azure Portal
2. Vérifiez que le modèle "sora" est bien déployé
3. Vérifiez le nom exact du déploiement

#### D. Paramètres invalides

**Symptômes** :
- Status HTTP: 400
- Message: "Invalid request"

**Solution** :
Vérifiez les paramètres dans `lib/sora.ts` :
- `height` et `width` : Doivent être des valeurs supportées (ex: 1080)
- `n_seconds` : Doit être >= 1 et <= la limite maximale
- `prompt` : Ne doit pas être vide

#### E. Quota dépassé

**Symptômes** :
- Status HTTP: 429
- Message: "Rate limit exceeded" ou "Quota exceeded"

**Solution** :
1. Attendez quelques minutes
2. Vérifiez vos quotas sur Azure Portal
3. Le modèle Sora a une limite de 60 requêtes/min

### 🛠️ Actions de dépannage

#### Étape 1 : Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Puis relancer
cd C:\Users\brieu\Documents\HEC_AI\background_magic
npm run dev
```

#### Étape 2 : Vérifier les logs

Regardez attentivement les logs dans le terminal du serveur. Les nouveaux logs `🎬 Sora -` vous donneront des détails précis.

#### Étape 3 : Tester avec curl (Windows PowerShell)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Api-key" = $env:AZURE_API_KEY
}

$body = @{
    model = "sora"
    prompt = "A beautiful sunset"
    height = 1080
    width = 1080
    n_seconds = 1
    n_variants = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri $env:AZURE_SORA_ENDPOINT -Method Post -Headers $headers -Body $body
```

#### Étape 4 : Vérifier Azure Portal

1. Allez sur https://portal.azure.com
2. Naviguez vers votre ressource Azure AI
3. Vérifiez :
   - Le modèle Sora est déployé
   - Les quotas disponibles
   - Les logs d'activité

### 📊 Interpréter les logs améliorés

Avec le code mis à jour, vous verrez :

```
🎬 Sora - Creating video generation job...
Endpoint: https://...
Params: { prompt: "...", height: 1080, width: 1080, n_seconds: 1, n_variants: 1 }
🎬 Sora - Response status: 200
🎬 Sora - Response body: {"id": "job-123", ...}
🎬 Sora - Job data: {...}
🎬 Sora - Job created with ID: job-123
🎬 Sora - Starting to poll job status...
🎬 Sora - Poll attempt 1/60
🎬 Sora - Job status: running
🎬 Sora - Full job data: {...}
```

Si vous voyez `status: failed`, cherchez dans les logs :
```
🎬 Sora - Job failed: { errorCode: "...", errorMessage: "..." }
```

### 💡 Solutions rapides

#### Si le prompt est trop long
Limitez le prompt à ~200 caractères maximum.

#### Si l'image URL n'est pas accessible
Vérifiez que le bucket Supabase `input-images` est bien **public**.

#### Si le job timeout
Augmentez `maxAttempts` dans `lib/sora.ts` (ligne 111).

### 📞 Besoin d'aide supplémentaire ?

1. Copiez tous les logs `🎬 Sora -` de votre console
2. Vérifiez le code de statut HTTP exact
3. Vérifiez le message d'erreur complet dans les logs

---

**Prochaine étape** : Exécutez `node test-sora.js` pour un diagnostic complet !
