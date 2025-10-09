-- Script SQL pour configurer la base de données Supabase

-- 1. Créer la table projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  input_image_url TEXT,
  output_image_url TEXT,
  prompt TEXT,
  status TEXT
);

-- 2. Activer RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Créer une politique pour permettre les insertions publiques
CREATE POLICY "Allow public insert" ON projects
  FOR INSERT
  WITH CHECK (true);

-- 4. Créer une politique pour permettre la lecture publique
CREATE POLICY "Allow public read" ON projects
  FOR SELECT
  USING (true);

-- Instructions pour créer les buckets (à faire manuellement dans le dashboard Supabase) :
-- 
-- 1. Allez dans Storage > Buckets
-- 2. Créez un bucket nommé "input-images" avec "Public bucket" activé
-- 3. Créez un bucket nommé "output-videos" avec "Public bucket" activé
-- 
-- Ou utilisez le SQL suivant si vous avez accès :

-- Créer les buckets (nécessite les permissions admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('input-images', 'input-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('output-videos', 'output-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Créer les politiques de stockage pour permettre l'upload et la lecture publique
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
