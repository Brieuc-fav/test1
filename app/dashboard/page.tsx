'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '@/components/VideoCard';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, Plus, AlertCircle } from 'lucide-react';

interface Project {
  id: string;
  prompt: string;
  input_image_url: string;
  output_image_url: string;
  created_at: string;
  user_id: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (deletedId: string) => {
    setProjects(projects.filter((p) => p.id !== deletedId));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Mes Vidéos
            </h1>
            <p className="text-muted-foreground">
              Retrouvez toutes vos créations générées avec Sora AI
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle vidéo
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-16 h-16 mb-6 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement de vos vidéos...</p>
          </div>
        ) : error ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold text-destructive mb-2">Erreur de chargement</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={loadProjects} variant="destructive">
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-2xl font-bold mb-2">Aucune vidéo pour le moment</h3>
              <p className="text-muted-foreground mb-8">
                Commencez par créer votre première vidéo avec Sora AI
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer ma première vidéo
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Statistiques</CardTitle>
                    <CardDescription>Vos vidéos générées</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-2xl px-4 py-2">
                    {projects.length}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <VideoCard
                  key={project.id}
                  id={project.id}
                  prompt={project.prompt}
                  inputImageUrl={project.input_image_url}
                  outputVideoUrl={project.output_image_url}
                  createdAt={project.created_at}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
