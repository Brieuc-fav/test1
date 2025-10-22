'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase-client';
import { 
  Upload, Wand2, Sparkles, Zap, Video, Download,
  Clock, Shield, Star, CheckCircle2, ArrowRight, Play, Loader2
} from 'lucide-react';

interface Subscription {
  quota_limit: number;
  quota_used: number;
  status: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('quota_limit, quota_used, status')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!imageFile || !prompt.trim()) {
      alert('Veuillez sélectionner une image et entrer une description.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('prompt', prompt);

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Vérifier si c'est une erreur de quota
        if (response.status === 403 && errorData.error === 'Quota épuisé') {
          alert('❌ Quota épuisé\n\n' + 
                errorData.message + '\n\n' +
                'Cliquez sur OK pour voir nos plans d\'abonnement.');
          router.push('/pricing');
          return;
        }
        
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      setProgress(100);
      setResult({ url: data.outputVideoUrl });
      
      // Recharger le quota après génération réussie
      await loadSubscription();
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.message || 'Une erreur est survenue';
      
      // Afficher un message d'erreur plus user-friendly
      if (errorMessage.includes('face_upload_not_allowed') || errorMessage.includes('visages')) {
        alert('⚠️ Les images avec des visages ne sont pas autorisées\n\n' +
              'Pour des raisons de sécurité et de confidentialité, Azure Sora ne peut pas générer de vidéos à partir d\'images contenant des visages humains.\n\n' +
              '💡 Suggestions :\n' +
              '• Utilisez des paysages, objets ou scènes sans personnes\n' +
              '• Essayez avec des illustrations ou dessins abstraits\n' +
              '• Utilisez des images d\'animaux, de nature ou d\'architecture');
      } else {
        alert(errorMessage);
      }
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="inline-flex items-center gap-2 px-4 py-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Propulsé par Sora AI d'OpenAI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold">
              Transformez vos <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">images en vidéos</span> magiques
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Donnez vie à vos images avec l'IA. Créez des vidéos époustouflantes en quelques clics.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Commencer gratuitement
            </Button>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 shadow-2xl">
              <CardContent className="p-12">
                {/* Affichage du quota si l'utilisateur est connecté */}
                {user && subscription && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                          Quota mensuel
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                          {subscription.quota_used} / {subscription.quota_limit} générations utilisées
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {subscription.quota_limit - subscription.quota_used}
                        </div>
                        <div className="text-xs text-blue-600">restantes</div>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(subscription.quota_used / subscription.quota_limit) * 100}%`,
                        }}
                      />
                    </div>
                    {subscription.quota_used >= subscription.quota_limit && (
                      <p className="mt-3 text-sm text-red-600 font-semibold">
                        ⚠️ Quota épuisé. <a href="/pricing" className="underline">Passez à un plan supérieur</a>
                      </p>
                    )}
                  </div>
                )}

                {/* Warning Banner */}
                <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        ⚠️ Restriction importante
                      </h3>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        Les images contenant des <strong>visages humains ne sont pas autorisées</strong> pour des raisons de sécurité. 
                        Utilisez des paysages, objets, animaux ou illustrations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold">1. Uploadez votre image</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed rounded-xl aspect-video"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <Upload className="w-12 h-12 mb-4" />
                          <p>Cliquez pour uploader</p>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold">2. Décrivez votre vidéo</label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ex: Une scène paisible avec un mouvement doux..."
                      className="min-h-[200px]"
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !imageFile || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6"
                  size="lg"
                >
                  {loading ? <><Loader2 className="mr-2 animate-spin" /> Génération... {progress}%</> : <><Wand2 className="mr-2" /> Générer ma vidéo</>}
                </Button>
                {result && (
                  <div className="mt-8">
                    <video src={result.url} controls autoPlay loop className="w-full rounded-xl" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
