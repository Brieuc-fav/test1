# ✅ GUIDE RAPIDE - Tester l'authentification

## 🚀 Le serveur est prêt !

Votre application tourne sur : **http://localhost:3000**

---

## 📝 AVANT DE TESTER - Configuration Supabase (5 min)

### ⚠️ IMPORTANT : Vous DEVEZ faire ceci d'abord !

L'authentification ne fonctionnera pas sans cette étape.

### 1. Allez sur Supabase SQL Editor

1. Ouvrez [supabase.com](https://supabase.com) dans un nouvel onglet
2. Connectez-vous et ouvrez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**

### 2. Copiez-collez ce script SQL

```sql
-- Ajouter la colonne user_id à la table projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Activer RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);
```

### 3. Exécutez le script

- Cliquez sur le bouton **Run** (en bas à droite)
- Vous devriez voir "Success. No rows returned" ✅

### 4. (OPTIONNEL) Désactiver la confirmation email pour le dev

Pour tester plus facilement en local :

1. Allez dans **Authentication** > **Providers**
2. Cliquez sur **Email**
3. **Décochez** "Confirm email"
4. Cliquez sur **Save**

> ⚠️ **Note** : Réactivez ceci en production !

---

## ✅ TESTER L'INSCRIPTION

### 1. Ouvrez l'application

Allez sur : **http://localhost:3000**

### 2. Cliquez sur "S'inscrire"

Dans le header en haut à droite, cliquez sur le bouton bleu **"S'inscrire"**

### 3. Remplissez le formulaire

- **Email** : utilisez un vrai email (ex: `test@example.com`)
- **Mot de passe** : minimum 6 caractères (ex: `test123`)

### 4. Cliquez sur "S'inscrire"

**Deux scénarios possibles :**

#### A. Si confirmation email DÉSACTIVÉE ✅
- Vous êtes redirigé vers `/`
- Vous voyez votre email dans le header
- ✅ **Vous êtes connecté !**

#### B. Si confirmation email ACTIVÉE 📧
- Vous voyez le message "Vérifiez votre email pour confirmer votre inscription !"
- Allez dans votre boîte email
- Cliquez sur le lien de confirmation
- Retournez sur l'app et connectez-vous via `/login`

---

## ✅ TESTER LA GÉNÉRATION DE VIDÉO

### 1. Assurez-vous d'être connecté

Vous devriez voir votre email en haut à droite du header.

### 2. Uploadez une image

- Cliquez sur "Sélectionnez une image"
- Choisissez une image sur votre ordinateur
- L'aperçu s'affiche à droite

### 3. Entrez un prompt

Exemple :
```
A beautiful sunset with moving clouds
```

### 4. Cliquez sur "Générer la vidéo (2s)"

- Le statut passe à "Upload de l'image en cours..."
- Puis "Génération de la vidéo avec Sora... Cela peut prendre 1-2 minutes."
- Attendez patiemment ⏳

### 5. Vérifiez le résultat

- La vidéo générée s'affiche à droite
- Elle se lance automatiquement
- ✅ **Ça marche !**

---

## 🔍 VÉRIFIER DANS SUPABASE

### 1. Vérifiez l'utilisateur

1. Allez dans **Authentication** > **Users**
2. Vous devriez voir votre compte avec votre email ✅

### 2. Vérifiez le projet

1. Allez dans **Table Editor** > **projects**
2. Vous devriez voir une ligne avec :
   - `user_id` = votre ID utilisateur
   - `prompt` = votre prompt
   - `input_image_url` = URL de votre image
   - `output_image_url` = URL de votre vidéo
   - `status` = "completed"

### 3. Vérifiez les fichiers

1. Allez dans **Storage** > **input-images**
   - Vous devriez voir un dossier avec votre `user_id`
   - À l'intérieur, votre image uploadée ✅

2. Allez dans **Storage** > **output-videos**
   - Vous devriez voir un dossier avec votre `user_id`
   - À l'intérieur, votre vidéo générée ✅

---

## 🐛 SI ÇA NE MARCHE PAS

### Erreur "Non authentifié"

**Cause** : Le script SQL n'a pas été exécuté dans Supabase

**Solution** : 
1. Retournez à l'étape "AVANT DE TESTER"
2. Exécutez le script SQL
3. Réessayez

### Erreur "Invalid login credentials"

**Causes possibles** :
- Email non confirmé (si confirmation activée)
- Mauvais mot de passe
- Compte non créé

**Solution** :
1. Vérifiez dans **Authentication** > **Users** si le compte existe
2. Si confirmation email activée, vérifiez votre email
3. Réessayez de vous inscrire avec un autre email

### La vidéo ne se génère pas

**Causes possibles** :
- Problème avec l'API Azure Sora
- Clé API invalide ou expirée
- Timeout (la génération prend trop de temps)

**Solution** :
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez que `AZURE_API_KEY` et `AZURE_SORA_ENDPOINT` sont corrects dans `.env.local`
3. Vérifiez les logs du terminal

### L'image ne s'upload pas

**Cause** : Problème avec les politiques RLS sur les buckets storage

**Solution** :
Le script SQL basique ne créeait pas les politiques pour les buckets. Exécutez ce script supplémentaire dans Supabase SQL Editor :

```sql
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own input images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own input images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own input images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own output videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own output videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own output videos" ON storage.objects;

-- Pour le bucket input-images
CREATE POLICY "Users can upload their own input images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'input-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own input images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'input-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own input images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'input-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Pour le bucket output-videos
CREATE POLICY "Users can upload their own output videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'output-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own output videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'output-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own output videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'output-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## ✅ CHECKLIST

- [ ] Script SQL principal exécuté dans Supabase
- [ ] Confirmation email désactivée (optionnel, pour dev)
- [ ] Inscription testée avec succès
- [ ] Connexion testée avec succès
- [ ] Email affiché dans le header
- [ ] Génération de vidéo testée avec succès
- [ ] Projet visible dans la table `projects` avec `user_id`
- [ ] Fichiers visibles dans les buckets storage avec le dossier `user_id`

---

## 🎉 FÉLICITATIONS !

Si tout fonctionne, votre app est maintenant sécurisée avec :
- ✅ Authentification email/mot de passe
- ✅ Protection des données par utilisateur
- ✅ Row Level Security (RLS)
- ✅ Interface préservée

**Prochaine étape** : Déployer sur Vercel ! 🚀
