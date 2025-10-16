# 🔧 Script SQL - Activer les politiques RLS

## Le problème

La colonne `user_id` existe, mais les **politiques de sécurité (RLS)** ne sont pas configurées.
Sans politiques, Supabase bloque l'accès aux données.

---

## Solution : Exécuter ce script SQL

### 1. Ouvrez Supabase
- Allez sur [https://supabase.com](https://supabase.com)
- Cliquez sur votre projet
- Allez dans **SQL Editor**
- Cliquez sur **New Query**

### 2. Copiez-collez ce script

```sql
-- Activer Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Politique: Voir ses propres projets
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid() = user_id);

-- Politique: Insérer ses propres projets
CREATE POLICY "Users can insert their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique: Mettre à jour ses propres projets
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique: Supprimer ses propres projets
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid() = user_id);

-- Vérification : Afficher les politiques créées
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'projects';
```

### 3. Cliquez sur "Run"

Vous devriez voir à la fin les 4 politiques créées :
- `Users can view their own projects`
- `Users can insert their own projects`
- `Users can update their own projects`
- `Users can delete their own projects`

---

## Après l'exécution

1. **Retournez sur votre app** : `http://localhost:3000`
2. **Connectez-vous** (si ce n'est pas déjà fait)
3. **Allez sur `/dashboard`**
4. **L'erreur devrait disparaître** ✅

---

## Vérification dans Supabase

### Option 1 : Via l'interface
1. Allez dans **Table Editor** > **projects**
2. Cliquez sur l'icône **🔒 (cadenas)** en haut
3. Vous devriez voir les 4 politiques RLS activées

### Option 2 : Via SQL
Exécutez cette requête :
```sql
SELECT * FROM pg_policies WHERE tablename = 'projects';
```

---

## Pourquoi ces politiques sont nécessaires ?

**Row Level Security (RLS)** = Sécurité au niveau des lignes

Sans RLS, **tous les utilisateurs** pourraient voir **tous les projets**.

Avec RLS :
- Chaque utilisateur ne voit **QUE** ses propres projets
- Impossible de voir/modifier/supprimer les projets des autres
- Sécurité garantie au niveau de la base de données

---

## Si ça ne marche toujours pas

Vérifiez que :
1. ✅ La colonne `user_id` existe dans la table `projects`
2. ✅ RLS est activé : `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`
3. ✅ Les 4 politiques sont créées
4. ✅ Vous êtes bien connecté à l'application
5. ✅ Le serveur dev est redémarré

---

**Exécutez le script SQL maintenant !** 🚀
