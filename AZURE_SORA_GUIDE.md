# 🚀 Utiliser Sora avec Azure (Azure AI Foundry)

## 📘 Vue d'ensemble

Ce projet utilise le modèle **Sora** via **Azure AI Foundry** pour générer des vidéos de 1 seconde à partir d'une **image et d'un prompt textuel**.

✅ **Fonctionnalité image-to-video** : Sora sur Azure AI Foundry supporte la génération de vidéos à partir d'images via le paramètre `inpaint_items` avec upload multipart/form-data.

---

## 🔑 Configuration Azure

### Variables d'environnement

Les variables sont déjà configurées dans `.env.local` :

```bash
AZURE_API_KEY=your_azure_api_key_here
AZURE_SORA_ENDPOINT=https://your-deployment.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
```

### Point de terminaison

L'API Sora est accessible à :
```
https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
```

---

## 🎬 Comment ça fonctionne

### 1. Création du job de génération (Image-to-Video)

L'application envoie une requête POST en **multipart/form-data** avec :
- `model`: "sora"
- `prompt`: Description de l'animation souhaitée
- `height`: 1080
- `width`: 1080
- `n_seconds`: 1
- `n_variants`: 1
- `inpaint_items`: Configuration de l'image de départ (JSON stringifié)
- `files`: Le fichier image lui-même

**Structure de `inpaint_items`** :
```json
[
  {
    "frame_index": 0,
    "type": "image",
    "file_name": "input.jpg",
    "crop_bounds": {
      "left_fraction": 0.0,
      "top_fraction": 0.0,
      "right_fraction": 1.0,
      "bottom_fraction": 1.0
    }
  }
]
```

**Note importante** : L'image est envoyée directement à Sora qui l'utilise comme point de départ pour générer la vidéo animée.

### 2. Polling du statut

L'application vérifie régulièrement (toutes les 2 secondes) le statut du job jusqu'à ce qu'il soit terminé.

### 3. Récupération de la vidéo

Une fois le job terminé, l'URL de la vidéo générée est récupérée et téléchargée.

---

## 📦 Paramètres Sora

| Paramètre | Type | Description | Valeur par défaut |
|-----------|------|-------------|-------------------|
| `model` | string | Nom du modèle | `"sora"` |
| `prompt` | string | Description de la vidéo à générer | - |
| `height` | integer | Hauteur en pixels | `1080` |
| `width` | integer | Largeur en pixels | `1080` |
| `n_seconds` | integer | Durée de la vidéo | `1` |
| `n_variants` | integer | Nombre de variantes | `1` |

---

## ⚙️ Détails du déploiement

| Champ | Valeur |
|-------|--------|
| Nom du modèle | sora |
| Version | 2025-05-02 |
| Type de déploiement | Standard global |
| Limite de débit | 60 requêtes/min, 60 000 tokens/min |
| Statut | Preview |
| Date de mise hors service | 15 février 2026 |

---

## 💻 Implémentation dans le projet

### Fichier `lib/sora.ts`

Ce fichier contient les fonctions pour :
- Créer un job de génération vidéo
- Effectuer le polling du statut
- Récupérer l'URL de la vidéo générée

### Fichier `app/api/generate/route.ts`

Cette API route :
1. Upload l'image dans Supabase (`input-images`)
2. Récupère l'URL publique de l'image
3. Appelle Sora avec l'URL de l'image et le prompt
4. Télécharge la vidéo générée
5. Upload la vidéo dans Supabase (`output-videos`)
6. Sauvegarde les informations dans la base de données

---

## 🔍 Exemple d'utilisation

### Depuis l'interface web

1. Uploadez une image
2. Entrez un prompt comme :
   - "Make this image come to life with subtle movement"
   - "Add a gentle animation to this scene"
   - "Create a short video loop from this image"
3. Cliquez sur "Générer la vidéo"
4. Attendez 1-2 minutes
5. La vidéo de 1 seconde s'affiche automatiquement

### Appel API direct (curl)

```bash
curl -X POST "https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview" \
  -H "Content-Type: application/json" \
  -H "Api-key: $AZURE_API_KEY" \
  -d '{
    "model": "sora",
    "prompt": "Based on this image: [URL]. Make it come to life",
    "height": 1080,
    "width": 1080,
    "n_seconds": 1,
    "n_variants": 1
  }'
```

---

## 🐛 Dépannage

### Erreur "Job timeout"
- Augmentez le `maxAttempts` dans `lib/sora.ts` (actuellement 60 tentatives = 2 minutes)

### Erreur "Invalid API key"
- Vérifiez que `AZURE_API_KEY` dans `.env.local` est correct

### Erreur "Endpoint not found"
- Vérifiez que `AZURE_SORA_ENDPOINT` est correct
- Le modèle Sora doit être déployé dans votre projet Azure

### La vidéo ne se génère pas
- Vérifiez les logs du serveur (`npm run dev`)
- Vérifiez que le bucket `output-videos` existe et est public
- Vérifiez que vous n'avez pas dépassé la limite de 60 requêtes/min

---

## 🔗 Ressources

- [Documentation Azure AI Foundry](https://learn.microsoft.com/azure/ai-foundry)
- [Dashboard Azure](https://portal.azure.com)
- [Endpoint REST](https://bapti-m70vyuu5-eastus2.openai.azure.com)

---

## 🧠 Conseil

Sora est actuellement en **Preview**, donc certaines fonctionnalités peuvent évoluer.
Surveillez la documentation officielle Azure pour les changements d'API et de quotas.

**Date de fin de preview** : 15 février 2026

---

## ⚠️ Limitations importantes

### 🚫 Sora Azure limitations :
- **Durées longues** : Limité à quelques secondes (1-10s recommandé en Preview)
- **Résolution maximale** : Varie selon le format choisi
- **Quota** : 60 requêtes/min, 60 000 tokens/min

### ✅ Sora Azure supporte :
- **Image-to-video** : ✅ Génération à partir d'une image de base (via `inpaint_items`)
- **Text-to-video** : ✅ Génération à partir de descriptions textuelles uniquement
- **Video-to-video** : ✅ Modification de vidéos existantes (via `inpaint_items` avec type "video")
- **Prompts riches** : Plus le prompt est descriptif et précis, meilleur est le résultat
- **Résolutions variables** : Différents formats (carré, paysage, portrait)
- **Multiples variantes** : Génération de plusieurs versions d'une même vidéo

### 🔄 Workflow actuel de l'application

1. **Upload image** : L'utilisateur upload une image (stockée dans Supabase)
2. **Prompt textuel** : L'utilisateur décrit l'animation/transformation souhaitée
3. **Génération Sora** : Sora génère une vidéo basée sur **l'image ET le prompt**
   - L'image est envoyée via `multipart/form-data`
   - Configuration via `inpaint_items` pour placer l'image au frame 0
   - Le prompt guide l'animation/transformation
4. **Téléchargement** : La vidéo générée est téléchargée depuis Azure
5. **Stockage** : La vidéo est stockée dans Supabase (bucket `output-videos`)
6. **Affichage** : La vidéo est affichée à l'utilisateur

**Exemple de workflow concret** :
- Image : Photo d'un paysage statique
- Prompt : "Add gentle camera movement, animate the clouds, add subtle wind effects"
- Résultat : Vidéo de 1 seconde du paysage avec les animations demandées
