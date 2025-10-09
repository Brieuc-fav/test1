# 🎬 Solution de Contournement - Azure Sora sans Download

## Situation Actuelle

Azure Sora API génère les vidéos mais **ne fournit aucun endpoint de téléchargement**.

## Solution Proposée: Mock/Demo Mode

En attendant qu'Azure résolve ce problème, voici 3 options :

---

## Option 1: Mode Démo avec Vidéo Placeholder (RECOMMANDÉ pour démo)

Afficher un message à l'utilisateur que la fonctionnalité est en attente de l'API Azure.

### Avantages
- ✅ L'app fonctionne end-to-end
- ✅ Permet de démontrer le concept
- ✅ Garde trace des jobs générés

### Implémentation

Créer une vidéo placeholder (GIF animé ou courte vidéo MP4) et l'uploader dans Supabase.

```typescript
// Dans app/api/generate/route.ts
// Remplacer la section download par:

console.log('⚠️ Azure Sora API ne fournit pas d endpoint de download');
console.log('📝 Sauvegarde du job ID:', jobId);
console.log('📝 Generation ID:', generationId);

// Upload d'une vidéo placeholder
const placeholderVideoUrl = 'https://bodpqqoqrwzlscziflzt.supabase.co/storage/v1/object/public/output-videos/placeholder.mp4';

// Ou créer une image animée basée sur l'input
const { data: outputPublicUrlData } = await supabaseAdmin.storage
  .from('output-videos')
  .getPublicUrl('placeholder-video.mp4');

const outputVideoUrl = outputPublicUrlData.publicUrl;

// Sauvegarder en DB avec les metadata Sora
await supabaseAdmin
  .from('projects')
  .insert({
    input_image_url: inputImageUrl,
    output_image_url: outputVideoUrl,
    prompt: prompt,
    status: 'completed',  // ou 'pending_azure_fix'
    sora_job_id: jobId,
    error_message: `Video generated (job: ${jobId}, gen: ${generationId}) but Azure API doesn't provide download endpoint`,
  });

return NextResponse.json({
  success: true,
  inputImageUrl,
  outputVideoUrl,
  warning: 'Using placeholder video - Azure Sora download endpoint not available',
  soraJobId: jobId,
  soraGenerationId: generationId,
});
```

---

## Option 2: Sauvegarder les IDs et afficher un message

Informer l'utilisateur que la vidéo a été générée mais n'est pas encore disponible.

```typescript
return NextResponse.json({
  success: false,
  error: 'La vidéo a été générée par Sora mais Azure ne fournit pas encore d\'endpoint de téléchargement. Contactez le support Azure ou attendez la version GA de l\'API.',
  metadata: {
    jobId,
    generationId,
    prompt,
    created_at: new Date().toISOString(),
  }
}, { status: 500 });
```

Interface utilisateur :
```typescript
// Dans page.tsx, afficher:
"✅ Vidéo générée avec succès par Sora !
⏳ Téléchargement non disponible dans la version preview de l'API Azure.
📝 Job ID: {metadata.jobId}
📧 Nous vous contacterons quand l'API sera mise à jour."
```

---

## Option 3: Switch vers OpenAI Native API (Si disponible)

Si vous avez accès à Sora via platform.openai.com (non Azure), leur API pourrait avoir un comportement différent.

```typescript
// Modifier lib/sora.ts pour utiliser:
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/video/generations';

// L'API OpenAI pourrait retourner un `url` direct
```

---

## Option 4: Contact Azure + Workaround Database

En attendant une réponse d'Azure Support :

1. **Sauvegarder tous les metadata**
   ```sql
   ALTER TABLE projects ADD COLUMN sora_generation_id TEXT;
   ALTER TABLE projects ADD COLUMN azure_endpoint TEXT;
   ALTER TABLE projects ADD COLUMN attempted_download_at TIMESTAMP;
   ```

2. **Background job qui retry**
   - Créer un cron job (Vercel Cron, Azure Functions, etc.)
   - Toutes les heures, essayer de re-télécharger les vidéos pendantes
   - Si l'API est mise à jour, les vidéos seront récupérées automatiquement

---

## Quelle option choisir ?

### Pour une DÉMO immédiate:
→ **Option 1** (placeholder video) - L'app fonctionne visuellement

### Pour un PRODUIT en attente:
→ **Option 2** (message utilisateur) + **Option 4** (background retry)

### Si vous avez accès OpenAI direct:
→ **Option 3** (switch API)

---

## Code Ready-to-Use: Option 1 (Placeholder)

Voulez-vous que j'implémente l'Option 1 avec :
- Création d'une vidéo placeholder simple
- Upload automatique dans Supabase
- Modification de route.ts pour l'utiliser
- Message dans l'UI expliquant la situation

Dites-moi quelle option vous préférez et je l'implémente immédiatement !
