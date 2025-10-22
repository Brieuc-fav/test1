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

interface Subscription {
  quota_limit: number;
  quota_used: number;
  status: string;
  stripe_price_id: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
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
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('quota_limit, quota_used, status, stripe_price_id')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) {
        console.error('Error loading subscription:', fetchError);
        return;
      }

      setSubscription(data);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
    }
  };

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

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur');
      }

      // Rediriger vers le portail Stripe
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.message || 'Une erreur est survenue');
    }
  };

  const getPlanName = () => {
    if (!subscription?.stripe_price_id) return 'Gratuit';
    if (subscription.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC) return 'Basic';
    if (subscription.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) return 'Pro';
    return 'Abonné';
  };

  const quotaPercentage = subscription
    ? Math.round((subscription.quota_used / subscription.quota_limit) * 100)
    : 0;

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

        {/* Carte d'abonnement */}
        {subscription && (
          <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Plan {getPlanName()}
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.status === 'active' ? 'Actif' : subscription.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {subscription.quota_used} / {subscription.quota_limit} générations utilisées ce mois-ci
                  </CardDescription>
                </div>
                <Button onClick={handleManageSubscription} variant="outline">
                  Gérer l'abonnement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quotaPercentage > 80
                      ? 'bg-red-500'
                      : quotaPercentage > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${quotaPercentage}%` }}
                />
              </div>
              {quotaPercentage >= 100 && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Quota épuisé. <Link href="/pricing" className="underline font-semibold">Mettez à niveau votre plan</Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!subscription && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Déverrouillez plus de générations
                  </h3>
                  <p className="text-muted-foreground">
                    Obtenez jusqu'à 200 générations par mois avec notre plan Pro
                  </p>
                </div>
                <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href="/pricing">Voir les plans</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
