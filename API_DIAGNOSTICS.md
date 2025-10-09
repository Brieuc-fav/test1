# 🔍 Diagnostic API Azure Sora - Endpoints

## Problème actuel

La vidéo est générée avec succès (status: succeeded) mais nous ne trouvons pas l'URL de téléchargement.

## Structure de la réponse du job

```json
{
  "status": "succeeded",
  "generations": [{
    "id": "gen_01k74fceydeb2rqtaa3ndyhs8d",
    "job_id": "task_01k74fbyghfq9a7wm2e7zxsw5v"
    // PAS d'URL ici !
  }]
}
```

## 🧪 Test manuel à faire

Ouvrez PowerShell et testez ces commandes :

### Test 1 : Récupérer la génération

```powershell
$API_KEY = $env:AZURE_API_KEY
$GEN_ID = "gen_01k74fceydeb2rqtaa3ndyhs8d"

$headers = @{
    "Api-key" = $API_KEY
}

# Essai 1
Invoke-RestMethod -Uri "https://your-deployment.openai.azure.com/openai/v1/video/generations/$GEN_ID?api-version=preview" -Headers $headers
```

### Test 2 : Récupérer le contenu

```powershell
# Essai 2
Invoke-RestMethod -Uri "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/$GEN_ID/content?api-version=preview" -Headers $headers
```

### Test 3 : Format OpenAI standard

```powershell
# Essai 3
Invoke-RestMethod -Uri "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/generations/$GEN_ID?api-version=preview" -Headers $headers
```

### Test 4 : Via le job ID

```powershell
$JOB_ID = "task_01k74fbyghfq9a7wm2e7zxsw5v"

# Essai 4
Invoke-RestMethod -Uri "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs/$JOB_ID?api-version=preview" -Headers $headers
```

## 📋 Que chercher dans les réponses ?

Pour chaque test, notez :
1. **Le code de statut** (200, 404, etc.)
2. **La structure JSON** retournée
3. **Cherchez ces propriétés** :
   - `url`
   - `video_url`
   - `output_url`
   - `content_url`
   - `download_url`
   - `file`
   - `data[0].url`

## 🔗 Documentation Azure à consulter

1. Allez sur Azure Portal : https://portal.azure.com
2. Cherchez votre ressource Azure AI
3. Regardez dans **Deployments** > **sora** > **API Reference**
4. Cherchez la section sur comment récupérer les vidéos générées

## 💡 Solutions alternatives

### Option A : L'API retourne peut-être l'URL dans une propriété différente

Peut-être que l'URL est dans un champ que nous n'avons pas vérifié. Copiez-moi la réponse complète d'un des tests ci-dessus.

### Option B : Il faut peut-être faire un polling sur la génération

Certaines API nécessitent de vérifier périodiquement la génération jusqu'à ce que l'URL soit disponible.

### Option C : L'URL est peut-être dans les headers HTTP

Parfois l'URL de téléchargement est dans un header HTTP comme `Location` ou `Content-Location`.

### Option D : Azure Storage

Azure pourrait stocker les vidéos dans Azure Storage et vous devez construire l'URL manuellement :
```
https://[storage-account].blob.core.windows.net/[container]/[generation-id].mp4
```

## 🎯 Action immédiate

Exécutez les tests PowerShell ci-dessus et partagez-moi :
1. Quel endpoint retourne un code 200 ?
2. Quelle est la structure JSON complète de la réponse ?

Avec ces informations, je pourrai corriger le code pour récupérer l'URL correcte !
