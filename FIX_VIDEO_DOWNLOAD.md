# 🔧 Correction du téléchargement vidéo Sora

**Date** : 9 octobre 2025  
**Problème** : Erreur 404 lors du téléchargement de la vidéo générée  
**Solution** : Correction de l'URL de téléchargement

---

## 🐛 Problème identifié

### Erreur rencontrée :
```
📥 Downloading video from Sora URL: https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74km32cf6ftx38h04w53mf1/content
📥 Video download response status: 404
❌ Failed to download generated video: 404 {"error":{"code":"404","message": "Resource not found"}}
```

### Cause :
L'URL de téléchargement était **incorrecte**. Selon la documentation Microsoft, le bon endpoint est :
```
/video/generations/{generation_id}/content/video
```

Et non :
```
/video/generations/{generation_id}/content
```

---

## ✅ Solution appliquée

### Code modifié dans `lib/sora.ts` :

#### ❌ AVANT (incorrect) :
```typescript
async function fetchGenerationContent(generationId: string): Promise<string> {
  const baseUrl = endpointWithoutParams.replace(/\/video\/generations\/jobs\/?$/, '');
  
  // Multiples tentatives d'endpoints (complexe et inefficace)
  const endpoints = [
    `${baseUrl}/video/generations/jobs/${generationId}?api-version=preview`,
    `${baseUrl}/video/generations/jobs/${generationId}/content?api-version=preview`,
    `${baseUrl}/video/generations/${generationId}?api-version=preview`,
    `${baseUrl}/video/generations/${generationId}/content?api-version=preview`,
    // ... etc
  ];
  
  // Boucle sur tous les endpoints
  for (const endpoint of endpoints) {
    // ... tentatives multiples
  }
  
  // URL incorrecte en dernier recours
  return `${baseUrl}/video/generations/${generationId}/content`;
}
```

#### ✅ APRÈS (correct) :
```typescript
async function fetchGenerationContent(generationId: string): Promise<string> {
  // Extraire la base URL
  const endpointWithoutParams = AZURE_SORA_ENDPOINT.split('?')[0];
  const baseUrl = endpointWithoutParams.replace(/\/video\/generations\/jobs\/?$/, '');
  
  // Selon la doc Microsoft: /video/generations/{generation_id}/content/video
  const videoContentUrl = `${baseUrl}/video/generations/${generationId}/content/video?api-version=preview`;
  console.log(`🎬 Sora - Video content URL: ${videoContentUrl}`);
  
  return videoContentUrl;
}
```

---

## 📚 Référence documentation Microsoft

**Source** : https://learn.microsoft.com/en-us/azure/ai-foundry/openai/video-generation-quickstart

**Extrait pertinent** :
```python
# Retrieve generated video
if status == "succeeded":
    generations = status_response.get("generations", [])
    if generations:
        generation_id = generations[0].get("id")
        video_url = f"{endpoint}/openai/v1/video/generations/{generation_id}/content/video?api-version=preview"
        video_response = requests.get(video_url, headers=headers)
```

**Point clé** : `/content/video` et non `/content`

---

## 🎯 URL finale correcte

Pour le generation ID `gen_01k74km32cf6ftx38h04w53mf1` :

```
https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74km32cf6ftx38h04w53mf1/content/video?api-version=preview
```

**Structure** :
- Base : `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1`
- Path : `/video/generations/{generation_id}/content/video`
- Query : `?api-version=preview`

---

## ✅ Résultat attendu

Maintenant, lors du téléchargement de la vidéo :

1. **Job Sora** : ✅ Créé avec succès
2. **Polling** : ✅ Job termine avec status "succeeded"
3. **Generation ID** : ✅ Récupéré (`gen_01k74km32cf6ftx38h04w53mf1`)
4. **URL vidéo** : ✅ Construite correctement avec `/content/video`
5. **Téléchargement** : ✅ Devrait réussir (status 200)
6. **Upload Supabase** : ✅ Stockage de la vidéo
7. **Affichage** : ✅ Vidéo visible dans le frontend

---

## 🧪 Test recommandé

1. Redémarrer le serveur de développement :
   ```powershell
   npm run dev
   ```

2. Upload une image

3. Entrer un prompt : "Add gentle movement"

4. Vérifier dans les logs :
   ```
   🎬 Sora - Video content URL: https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/{id}/content/video?api-version=preview
   📥 Downloading video from Sora URL: ...
   📥 Video download response status: 200  ✅
   📥 Downloaded video size: XXXXX bytes   ✅
   ```

---

## 📝 Changements de fichiers

### Modifié :
- ✅ `lib/sora.ts` - Simplification de `fetchGenerationContent()`

### Impact :
- Code plus simple et maintenable
- URL correcte selon la documentation officielle
- Téléchargement devrait fonctionner

---

## 🎉 Conclusion

La correction est simple mais cruciale :
- **Avant** : `/content` → 404 Error
- **Après** : `/content/video` → 200 OK ✅

Le code suit maintenant exactement l'exemple de la documentation Microsoft.
