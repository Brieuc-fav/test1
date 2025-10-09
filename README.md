# 🎬 Video Magic

Un générateur de vidéos SaaS utilisant Sora (Azure AI) pour transformer vos images en vidéos de 1 seconde.

## 🚀 Stack Technique

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (Stockage & Base de données)
- **Azure Sora** (Génération de vidéos avec IA)

## 📋 Prérequis Supabase

Avant de lancer l'application, assurez-vous que votre projet Supabase est configuré :

### 1. Créer les buckets de stockage

Dans votre dashboard Supabase (Storage) :

- **input-images** (public)
- **output-videos** (public)

### 2. Créer la table `projects`

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  input_image_url TEXT,
  output_image_url TEXT,
  prompt TEXT,
  status TEXT
);
```

## 🔧 Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🎯 Utilisation

1. **Sélectionnez une image** à animer
2. **Écrivez un prompt** décrivant l'animation ou la transformation souhaitée
3. **Cliquez sur "Générer"** et attendez 1-2 minutes
4. **Visualisez** l'image originale et la vidéo générée (1 seconde) côte à côte

## 📁 Structure du projet

```
background_magic/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # API route pour la génération
│   ├── globals.css           # Styles globaux
│   ├── layout.tsx            # Layout principal
│   └── page.tsx              # Page d'accueil
├── lib/
│   └── supabase.ts           # Configuration Supabase
├── .env.local                # Variables d'environnement
├── next.config.js            # Configuration Next.js
├── package.json              # Dépendances
└── tsconfig.json             # Configuration TypeScript
```

## 🔑 Variables d'environnement

Le fichier `.env.local` contient toutes les clés nécessaires :

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AZURE_API_KEY` (Clé Azure pour Sora)
- `AZURE_SORA_ENDPOINT` (Endpoint Azure AI Foundry)

## 🎨 Fonctionnalités

- ✅ Upload d'images
- ✅ Génération de vidéos avec Sora (Azure AI)
- ✅ Vidéos de 1 seconde au format 1080x1080
- ✅ Stockage sécurisé sur Supabase
- ✅ Interface moderne et responsive
- ✅ Affichage côte à côte de l'image originale et de la vidéo générée
- ✅ États de chargement et messages d'erreur

## 🤖 Modèle IA

Le projet utilise **Sora** via **Azure AI Foundry** pour générer des vidéos courtes à partir d'images et de prompts textuels.

- **Modèle** : Sora (Azure)
- **Endpoint** : Azure AI Foundry
- **Durée** : 1 seconde par vidéo
- **Format** : 1080x1080 (carré)
- **Limite** : 60 requêtes/min

## 📝 Notes

- Le temps de génération varie entre 30 et 60 secondes
- Les images sont stockées de façon permanente sur Supabase
- L'historique des générations est sauvegardé dans la table `projects`

## 🛠️ Développement

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Lancer en production
npm start
```

---

Développé avec ❤️ en utilisant Next.js et l'IA
