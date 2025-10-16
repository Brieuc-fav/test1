# ⚠️ URGENT - Exécuter ce script SQL dans Supabase

## Vous avez l'erreur "column projects.user_id does not exist"

### Étapes à suivre MAINTENANT :

1. **Ouvrez Supabase** : [https://supabase.com](https://supabase.com)
2. **Sélectionnez votre projet**
3. **Cliquez sur "SQL Editor"** dans le menu de gauche
4. **Cliquez sur "New Query"**
5. **Copiez-collez le script ci-dessous**
6. **Cliquez sur "Run"**

---

## Script SQL à exécuter :

```sql
-- Ajouter la colonne user_id
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Activer Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes politiques
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Nouvelles politiques
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

---

## Après l'exécution :

1. Retournez sur votre app : `http://localhost:3000`
2. Allez sur `/dashboard`
3. L'erreur devrait disparaître ✅

---

**NOTE** : Sans cette étape, le dashboard ne peut pas fonctionner car la colonne `user_id` n'existe pas dans la base de données.
