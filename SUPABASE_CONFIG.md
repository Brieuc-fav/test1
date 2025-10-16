# 🚀 Configuration Supabase - Étapes Rapides

## Ce qui a changé dans l'app

✅ **L'interface reste identique** - La page `/` garde son upload d'image
✅ **Authentification optionnelle** - Header avec "Se connecter" / "S'inscrire"
✅ **Protection des API** - Seules les routes `/api/*` nécessitent une connexion
✅ **Données par utilisateur** - Chaque user ne voit que ses projets

---

## 📝 ÉTAPE 1 : Exécuter le script SQL dans Supabase

### 1. Connectez-vous à Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur votre projet **Background Magic**

### 2. Ouvrez l'éditeur SQL

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query**

### 3. Copiez-collez ce script SQL

```sql
-- Ajouter la colonne user_id à la table projects
ALTER TABLE projects
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour améliorer les performances
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Activer RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir uniquement leurs propres projets
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres projets
CREATE POLICY "Users can insert their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent mettre à jour leurs propres projets
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres projets
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid() = user_id);

-- Activer RLS sur les buckets de storage
-- Pour le bucket input-images
CREATE POLICY "Users can upload their own input images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'input-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own input images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'input-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own input images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'input-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Pour le bucket output-videos
CREATE POLICY "Users can upload their own output videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'output-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own output videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'output-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own output videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'output-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. Exécutez le script

1. Cliquez sur le bouton **Run** (en bas à droite)
2. Vérifiez qu'il n'y a pas d'erreur
3. Vous devriez voir "Success. No rows returned"

---

## 📧 ÉTAPE 2 : Activer l'authentification Email

### 1. Configuration de base

1. Dans Supabase, allez dans **Authentication** > **Providers**
2. Vérifiez que **Email** est activé (normalement activé par défaut)

### 2. URLs de redirection

1. Allez dans **Authentication** > **URL Configuration**
2. Dans **Site URL**, ajoutez : `http://localhost:3000`
3. Dans **Redirect URLs**, ajoutez :
   ```
   http://localhost:3000/**
   https://votre-app.vercel.app/**
   ```

### 3. Désactiver la confirmation email (OPTIONNEL - pour dev uniquement)

> ⚠️ **Attention** : À faire uniquement pour le développement local !

1. Allez dans **Authentication** > **Providers**
2. Cliquez sur **Email** pour le configurer
3. **Décochez** "Confirm email"
4. Cliquez sur **Save**

Cela permet de créer des comptes sans avoir à vérifier l'email (pratique pour dev).

---

## ✅ ÉTAPE 3 : Tester en local

### 1. Démarrez le serveur

```bash
npm run dev
```

### 2. Ouvrez l'app

Allez sur `http://localhost:3000`

### 3. Testez l'inscription

1. Cliquez sur **"S'inscrire"** dans le header
2. Entrez un email et mot de passe (min 6 caractères)
3. Cliquez sur **"S'inscrire"**
4. Si confirmation email activée : vérifiez votre email
5. Si confirmation email désactivée : vous êtes directement connecté

### 4. Testez la génération de vidéo

1. Uploadez une image
2. Entrez un prompt
3. Cliquez sur **"Générer la vidéo"**
4. Attendez 1-2 minutes
5. La vidéo devrait s'afficher !

### 5. Vérifiez dans Supabase

1. Allez dans **Authentication** > **Users**
   - Vous devriez voir votre compte

2. Allez dans **Table Editor** > **projects**
   - Vous devriez voir votre projet avec le `user_id`

3. Allez dans **Storage** > **input-images**
   - Vous devriez voir un dossier avec votre `user_id`
   - À l'intérieur, votre image uploadée

4. Allez dans **Storage** > **output-videos**
   - Vous devriez voir un dossier avec votre `user_id`
   - À l'intérieur, votre vidéo générée

---

## 🔒 Ce qui est protégé

### ✅ API Routes
- `/api/generate` - Nécessite une connexion
- `/api/delete` - Nécessite une connexion

### ✅ Base de données
- Chaque user ne peut voir que ses propres projets
- RLS empêche l'accès aux projets des autres users

### ✅ Storage
- Les fichiers sont organisés par `user_id`
- Chaque user ne peut accéder qu'à ses propres fichiers

### ✅ Pages
- `/` - **Accessible à tous** (comme avant)
- `/login` - Page de connexion
- `/signup` - Page d'inscription

---

## 🐛 Dépannage

### Erreur "Non authentifié" lors de la génération

**Solution** : Connectez-vous d'abord via le bouton "Se connecter" dans le header

### Erreur SQL lors de l'exécution du script

**Problème** : La colonne `user_id` existe déjà

**Solution** : Modifiez la première ligne du script :
```sql
-- Au lieu de:
ALTER TABLE projects ADD COLUMN user_id UUID...

-- Utilisez:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID...
```

### Les politiques RLS existent déjà

**Solution** : Supprimez d'abord les anciennes politiques :
```sql
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
-- etc.
```

Puis réexécutez le script complet.

### Email de confirmation non reçu

**Solutions** :
1. Vérifiez vos spams
2. Dans Supabase, vérifiez **Authentication** > **Email Templates**
3. Pour le dev, désactivez la confirmation email (voir ÉTAPE 2.3)

---

## 🎉 C'est tout !

Votre app est maintenant configurée avec :
- ✅ Authentification email/mot de passe
- ✅ Protection des données par utilisateur
- ✅ Interface originale préservée
- ✅ Sécurité avec Row Level Security

**Prochaine étape** : Déployer sur Vercel avec les variables d'environnement !
