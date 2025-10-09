-- Improved Supabase Schema for Background Magic
-- Run this in your Supabase SQL Editor

-- 1. Projects table (stores video generation history)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Input/Output
  input_image_url TEXT NOT NULL,
  output_image_url TEXT,
  
  -- Generation details
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  sora_job_id TEXT,
  generation_time_seconds INTEGER,
  
  -- Indexes for common queries
  CONSTRAINT projects_status_check CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- 2. Waiting list table
CREATE TABLE IF NOT EXISTS public.waiting_list (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  email TEXT NOT NULL UNIQUE,
  subscribed BOOLEAN DEFAULT true,
  
  CONSTRAINT waiting_list_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON public.waiting_list(email);

-- 3. Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for projects
DROP POLICY IF EXISTS "Allow public insert" ON public.projects;
CREATE POLICY "Allow public insert" ON public.projects
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read" ON public.projects;
CREATE POLICY "Allow public read" ON public.projects
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public update" ON public.projects;
CREATE POLICY "Allow public update" ON public.projects
  FOR UPDATE
  USING (true);

-- 5. RLS Policies for waiting_list
DROP POLICY IF EXISTS "Allow public insert waiting list" ON public.waiting_list;
CREATE POLICY "Allow public insert waiting list" ON public.waiting_list
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read waiting list" ON public.waiting_list;
CREATE POLICY "Allow public read waiting list" ON public.waiting_list
  FOR SELECT
  USING (true);

-- 6. Create storage buckets (if not exists)
-- Note: This needs to be run with appropriate permissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('input-images', 'input-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('output-videos', 'output-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Storage policies for input-images
DROP POLICY IF EXISTS "Allow public upload to input-images" ON storage.objects;
CREATE POLICY "Allow public upload to input-images" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'input-images');

DROP POLICY IF EXISTS "Allow public read from input-images" ON storage.objects;
CREATE POLICY "Allow public read from input-images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'input-images');

DROP POLICY IF EXISTS "Allow public delete from input-images" ON storage.objects;
CREATE POLICY "Allow public delete from input-images" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'input-images');

-- 8. Storage policies for output-videos
DROP POLICY IF EXISTS "Allow public upload to output-videos" ON storage.objects;
CREATE POLICY "Allow public upload to output-videos" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'output-videos');

DROP POLICY IF EXISTS "Allow public read from output-videos" ON storage.objects;
CREATE POLICY "Allow public read from output-videos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'output-videos');

DROP POLICY IF EXISTS "Allow public delete from output-videos" ON storage.objects;
CREATE POLICY "Allow public delete from output-videos" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'output-videos');

-- 9. Verify setup
SELECT 'Projects table created' AS status, COUNT(*) AS row_count FROM public.projects
UNION ALL
SELECT 'Waiting list created', COUNT(*) FROM public.waiting_list
UNION ALL
SELECT 'Input images bucket', COUNT(*) FROM storage.buckets WHERE id = 'input-images'
UNION ALL
SELECT 'Output videos bucket', COUNT(*) FROM storage.buckets WHERE id = 'output-videos';
