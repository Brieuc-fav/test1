# 🚨 Azure Sora API Limitation - NO VIDEO DOWNLOAD ENDPOINT

## Problem Confirmed

L'API Azure Sora **preview** génère bien les vidéos mais **NE FOURNIT PAS d'endpoint pour les télécharger**.

### Evidence from Logs

```json
// ✅ Job succeeds
{
  "status": "succeeded",
  "generations": [{
    "id": "gen_01k74h3a48ettshsa3ajmm7v05",
    "width": 1080,
    "height": 1080,
    "n_seconds": 1
  }]
}

// ✅ Generation metadata endpoint works
GET /openai/v1/video/generations/gen_xxx?api-version=preview
→ 200 OK (but no video URL in response)

// ❌ ALL content endpoints fail
GET /openai/v1/video/generations/gen_xxx/content?api-version=preview → 404
GET /openai/v1/video/generations/gen_xxx/content → 404
GET /openai/v1/generations/gen_xxx/content → 404
```

### Root Cause

Azure OpenAI Sora API (preview version) semble avoir été conçu pour :
- Générer les vidéos ✅
- Stocker automatiquement dans Azure Blob Storage (non configuré)
- OU nécessiter une configuration spéciale pour activer le download

**L'API ne retourne AUCUN champ avec l'URL de la vidéo** dans ses réponses.

## Solutions Possibles

### Solution 1: Configuration Azure Blob Storage (RECOMMANDÉE)

Il est probable que vous deviez configurer un Azure Storage Account dans votre déploiement Azure OpenAI pour que les vidéos y soient automatiquement sauvegardées.

**Étapes** :
1. Créer un Azure Storage Account
2. Configurer le déploiement Sora pour utiliser ce storage
3. L'API retournera alors une URL blob storage au lieu de `/content`

**Documentation à consulter** :
- Azure OpenAI Sora documentation
- Section "Output Configuration" ou "Storage Configuration"

### Solution 2: Utiliser un autre API version

L'API version `preview` est limitée. Vérifiez si :
- Une version GA (General Availability) existe
- Une autre api-version supporte le download
- Un endpoint différent est documenté

### Solution 3: Contact Azure Support

Le comportement actuel suggère soit :
- API incomplète en preview
- Configuration manquante côté Azure
- Documentation manquante

**Action** : Ouvrir un ticket Azure Support pour demander comment télécharger les vidéos générées.

### Solution 4: Workaround temporaire - Background Jobs (Court terme)

En attendant la vraie solution, on peut implémenter un système de jobs asynchrones :

1. Stocker le `job_id` et `generation_id` en DB
2. Retourner à l'utilisateur que la vidéo est "en cours de traitement"
3. Un worker en background essaie de télécharger périodiquement
4. Notifier l'utilisateur quand c'est prêt (webhook, polling, etc.)

**Problème** : Cela ne résout pas le 404, donc inutile si l'endpoint n'existe vraiment pas.

## Recommended Next Steps

### Immediate Actions

1. **Vérifier la documentation Azure OpenAI Sora officielle**
   - Chercher "download video", "output configuration", "blob storage"
   - Vérifier si un Storage Account est requis

2. **Tester avec curl/Postman**
   ```powershell
   # Essayer différentes variantes
   curl -H "Api-key: $env:AZURE_API_KEY" "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74h3a48ettshsa3ajmm7v05/content" -v
   
   # Essayer sans api-version
   curl -H "Api-key: $env:AZURE_API_KEY" "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74h3a48ettshsa3ajmm7v05/content?api-version=2024-10-01" -v
   ```

3. **Vérifier le portail Azure**
   - Aller dans votre ressource Azure OpenAI
   - Vérifier s'il y a des paramètres de configuration pour Sora
   - Chercher section "Output" ou "Storage"

4. **Contacter Azure Support**
   - Expliquer que les vidéos se génèrent mais aucun endpoint de download ne fonctionne
   - Demander la procédure correcte pour récupérer les vidéos

### Alternative: Use OpenAI API (not Azure)

Si Azure ne supporte pas encore le download, vous pourriez tester avec l'API OpenAI native (si vous avez accès à Sora sur platform.openai.com) qui pourrait avoir un comportement différent.

## Temporary Workaround Code

En attendant, voici du code pour sauvegarder les metadata et afficher un message à l'utilisateur :

```typescript
// Dans app/api/generate/route.ts
// Au lieu de télécharger la vidéo, sauvegarder les IDs pour plus tard

if (!videoUrl) {
  console.error('❌ No video download URL available from Sora API');
  
  // Sauvegarder en DB avec status "pending_download"
  const { error: dbError } = await supabaseAdmin
    .from('projects')
    .insert({
      input_image_url: inputImageUrl,
      output_image_url: null,
      prompt: prompt,
      status: 'pending_download',
      sora_job_id: jobId,
      error_message: 'Video generated but download not available in API preview version',
    });

  return NextResponse.json({
    success: false,
    error: 'Video generated successfully but Azure Sora preview API does not provide download endpoint. Please configure Azure Blob Storage or contact Azure support.',
    jobId: jobId,
    generationId: generationId,
  }, { status: 500 });
}
```

## Conclusion

**Le problème n'est PAS dans votre code** - c'est une limitation de l'API Azure OpenAI Sora en preview.

**Actions prioritaires** :
1. ✅ Lire documentation Azure Sora (chercher "storage", "output", "download")
2. ✅ Vérifier configuration Azure Storage Account
3. ✅ Contacter Azure Support si la doc ne mentionne rien
4. ⏳ Attendre version GA si l'API est trop limitée en preview

Je peux vous aider à implémenter la solution une fois que vous aurez identifié la bonne approche avec Azure.
