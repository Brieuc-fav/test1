# 🔧 Fix: Correction de l'URL Azure Sora

## Problème Identifié

L'endpoint Azure Sora contient `/jobs/` dans le chemin :
```
https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
```

Mais quand on construisait les URLs pour fetcher la génération, on perdait le `/jobs/` :
- ❌ Avant : `https://...com/openai/v1/video/generations/gen_xxx/content`
- ✅ Maintenant : `https://...com/openai/v1/video/generations/jobs/gen_xxx/content`

## Changements Appliqués

### `lib/sora.ts`

1. **Poll endpoint** : Déjà correct (gardait `/jobs/`)
   ```typescript
   const baseEndpoint = AZURE_SORA_ENDPOINT.split('?')[0];
   const pollEndpoint = `${baseEndpoint}/${jobId}?api-version=preview`;
   ```

2. **fetchGenerationContent** : Maintenant teste AVEC et SANS `/jobs/`
   ```typescript
   const endpointWithoutParams = AZURE_SORA_ENDPOINT.split('?')[0];
   const baseUrl = endpointWithoutParams.replace(/\/video\/generations\/jobs\/?$/, '');
   
   const endpoints = [
     // AVEC /jobs/
     `${baseUrl}/video/generations/jobs/${generationId}?api-version=preview`,
     `${baseUrl}/video/generations/jobs/${generationId}/content?api-version=preview`,
     // SANS /jobs/
     `${baseUrl}/video/generations/${generationId}?api-version=preview`,
     `${baseUrl}/video/generations/${generationId}/content?api-version=preview`,
     // ... autres variantes
   ];
   ```

## Endpoints Testés (dans l'ordre)

Avec `AZURE_SORA_ENDPOINT = https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview`

Et `generationId = gen_01k74h3a48ettshsa3ajmm7v05`

Le code va maintenant tester :

1. ✅ `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs/gen_01k74h3a48ettshsa3ajmm7v05?api-version=preview`
2. ✅ `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs/gen_01k74h3a48ettshsa3ajmm7v05/content?api-version=preview`
3. `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74h3a48ettshsa3ajmm7v05?api-version=preview`
4. `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/gen_01k74h3a48ettshsa3ajmm7v05/content?api-version=preview`
5. `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/generations/gen_01k74h3a48ettshsa3ajmm7v05?api-version=preview`
6. `https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/generations/gen_01k74h3a48ettshsa3ajmm7v05/content?api-version=preview`

**Les endpoints #1 et #2 sont les nouvelles tentatives avec `/jobs/` !**

## Test

Relancez l'app et testez :

```powershell
npm run dev
```

Regardez les logs pour voir si les nouveaux endpoints avec `/jobs/` fonctionnent mieux. Les logs afficheront :

```
🎬 Sora - Base URL extracted: https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1
🎬 Sora - Fetching generation metadata for gen_xxx...
🎬 Sora - Trying content endpoint: https://.../video/generations/jobs/gen_xxx?api-version=preview
```

## Résultat Attendu

- **Si ça fonctionne** : Le endpoint avec `/jobs/` retournera 200 et on pourra télécharger la vidéo ! 🎉
- **Si ça ne fonctionne toujours pas** : On aura confirmé que l'API Azure Sora ne supporte vraiment pas le téléchargement, et il faudra contacter Azure Support.

## Next Steps

Après le test, 2 scénarios :

### Scénario A: Ça marche ! ✅
- On nettoie le code
- On améliore les messages d'erreur
- On teste le flow complet avec Supabase

### Scénario B: Ça ne marche toujours pas ❌
- On implémente le workaround avec sauvegarde metadata
- On affiche un message utilisateur clair
- On prépare le message pour Azure Support
- On met en place un système de retry background
