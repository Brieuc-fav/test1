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
import { Loader2, Video, Plus, AlertCircle, Sparkles } from 'lucide-react';

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
          <Card className="mb-8 border-4 border-purple-300 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-3xl font-black text-white mb-3">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                      {getPlanName() === 'Pro' ? '👑' : '⚡'}
                    </div>
                    Plan {getPlanName()}
                  </CardTitle>
                  <Badge 
                    className={`${
                      subscription.status === 'active' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white font-bold px-4 py-1 text-sm`}
                  >
                    {subscription.status === 'active' ? '✓ Actif' : subscription.status}
                  </Badge>
                </div>
                <Button 
                  onClick={handleManageSubscription} 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 font-bold"
                >
                  ⚙️ Gérer
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">
                      Générations ce mois
                    </p>
                    <p className="text-white text-2xl font-black">
                      {subscription.quota_used} / {subscription.quota_limit}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black text-white drop-shadow-lg">
                      {subscription.quota_limit - subscription.quota_used}
                    </div>
                    <div className="text-white/80 text-sm font-bold uppercase">
                      Restantes
                    </div>
                  </div>
                </div>
                
                {/* Barre de progression améliorée */}
                <div className="relative">
                  <div className="w-full bg-white/30 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                        quotaPercentage > 80
                          ? 'bg-gradient-to-r from-red-400 to-red-600'
                          : quotaPercentage > 50
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : 'bg-gradient-to-r from-green-400 to-emerald-500'
                      }`}
                      style={{ width: `${Math.max(quotaPercentage, 3)}%` }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow">
                        {quotaPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {quotaPercentage >= 100 ? (
                <div className="bg-red-500 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-white font-bold">⚠️ Quota épuisé !</span>
                  <Link href="/pricing">
                    <Button className="bg-white text-red-600 hover:bg-gray-100 font-bold">
                      Upgrader 🚀
                    </Button>
                  </Link>
                </div>
              ) : quotaPercentage > 80 ? (
                <p className="text-yellow-200 font-semibold text-center">
                  ⚡ Plus que {subscription.quota_limit - subscription.quota_used} générations !
                </p>
              ) : (
                <p className="text-white/90 text-center font-medium">
                  ✨ Encore {subscription.quota_limit - subscription.quota_used} générations disponibles
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {!subscription && (
          <Card className="mb-8 border-4 border-purple-300 bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-3xl font-black mb-3">
                  Déverrouillez plus de générations !
                </h3>
                <p className="text-white/90 text-xl mb-6">
                  Obtenez jusqu'à 200 générations par mois avec notre plan Pro
                </p>
                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg px-8 py-6"
                >
                  <Link href="/pricing">
                    <Sparkles className="mr-2" />
                    Voir les plans 🚀
                  </Link>
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
