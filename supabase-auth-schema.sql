-- Ajouter la colonne user_id à la table projects
ALTER TABLE projects
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour améliorer les performances des requêtes filtrées par user_id
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Activer RLS (Row Level Security) sur la table projects
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

-- Activer RLS sur les buckets de storage (input-images et output-videos)
-- Ces politiques permettent aux utilisateurs d'accéder uniquement à leurs propres fichiers

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
