# 🔧 Configuration Supabase - Instructions

## Étape 1 : Accéder à votre projet Supabase

Allez sur : https://supabase.com/dashboard/project/bodpqqoqrwzlscziflzt

## Étape 2 : Créer la table `projects`

1. Dans le menu de gauche, cliquez sur **SQL Editor**
2. Cliquez sur **New Query**
3. Copiez-collez ce code SQL :

```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  input_image_url TEXT,
  output_image_url TEXT,
  prompt TEXT,
  status TEXT
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON projects
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read" ON projects
  FOR SELECT
  USING (true);
```

4. Cliquez sur **Run** pour exécuter

## Étape 3 : Créer les buckets de stockage

### Méthode 1 : Via l'interface (Recommandé)

1. Dans le menu de gauche, cliquez sur **Storage**
2. Cliquez sur **New bucket**
3. Créez le premier bucket :
   - Nom : `input-images`
   - ✅ Cochez **Public bucket**
   - Cliquez sur **Create bucket**
4. Répétez pour le second bucket :
   - Nom : `output-videos`
   - ✅ Cochez **Public bucket**
   - Cliquez sur **Create bucket**

### Méthode 2 : Via SQL

1. Dans **SQL Editor**, créez une nouvelle requête
2. Copiez-collez ce code :

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('input-images', 'input-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('output-videos', 'output-videos', true)
ON CONFLICT (id) DO NOTHING;
```

3. Cliquez sur **Run**

## Étape 4 : Configurer les politiques de stockage

Dans **SQL Editor**, exécutez :

```sql
CREATE POLICY "Allow public upload to input-images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'input-images');

CREATE POLICY "Allow public read from input-images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'input-images');

CREATE POLICY "Allow public upload to output-videos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'output-videos');

CREATE POLICY "Allow public read from output-videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'output-videos');
```

## ✅ Vérification

### Vérifier la table

1. Allez dans **Table Editor**
2. Vous devriez voir la table `projects` avec les colonnes :
   - id
   - created_at
   - input_image_url
   - output_image_url
   - prompt
   - status

### Vérifier les buckets

1. Allez dans **Storage**
2. Vous devriez voir :
   - ✅ `input-images` (Public)
   - ✅ `output-videos` (Public)

## 🚀 Prêt à lancer !

Une fois la configuration terminée, vous pouvez lancer l'application :

```bash
npm run dev
```

Et accédez à : http://localhost:3000
