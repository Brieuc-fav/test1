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
      console.log('Loading subscription for user:', user?.id);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('quota_limit, quota_used, status')
        .eq('user_id', user?.id)
        .single();

      console.log('Subscription data:', data, 'Error:', error);
      
      if (!error && data) {
        setSubscription(data);
      } else if (error) {
        console.error('Subscription fetch error:', error);
        // Si pas de subscription, on pourrait en créer une gratuite
        setSubscription({ quota_limit: 50, quota_used: 0, status: 'active' });
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
            <Badge className="inline-flex items-center gap-2 px-3 py-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Propulsé par Sora AI d'OpenAI
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              Transformez vos <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">images en vidéos</span> magiques
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Donnez vie à vos images avec l'IA. Créez des vidéos époustouflantes en quelques clics.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={() => document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Commencer gratuitement
            </Button>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Compteur de Quota - TOUJOURS VISIBLE si connecté */}
            {user && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1">
                      🎬 Vos Générations
                    </h3>
                    {subscription ? (
                      <p className="text-blue-100 text-sm">
                        {subscription.quota_used} utilisées / {subscription.quota_limit} disponibles
                      </p>
                    ) : (
                      <p className="text-blue-100 text-sm">Chargement...</p>
                    )}
                  </div>
                  {subscription && (
                    <div className="text-right bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <div className="text-3xl font-black">
                        {subscription.quota_limit - subscription.quota_used}
                      </div>
                      <div className="text-xs uppercase font-semibold tracking-wider">
                        Restantes
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Barre de progression */}
                {subscription && (
                  <>
                    <div className="relative">
                      <div className="w-full bg-white/30 backdrop-blur-sm rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max((subscription.quota_used / subscription.quota_limit) * 100, 3)}%`,
                          }}
                        >
                          <span className="text-xs font-bold text-white drop-shadow">
                            {Math.round((subscription.quota_used / subscription.quota_limit) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Messages selon le quota */}
                    {subscription.quota_used >= subscription.quota_limit ? (
                      <div className="mt-3 p-3 bg-red-500 rounded-lg flex items-center justify-between text-sm">
                        <span className="font-semibold">⚠️ Quota épuisé !</span>
                        <a href="/pricing" className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition">
                          Upgrader 🚀
                        </a>
                      </div>
                    ) : subscription.quota_used / subscription.quota_limit > 0.8 ? (
                      <p className="mt-3 text-yellow-200 font-semibold text-center text-sm">
                        ⚡ Plus que {subscription.quota_limit - subscription.quota_used} générations !
                      </p>
                    ) : (
                      <p className="mt-3 text-center text-blue-100 text-sm">
                        ✨ Encore {subscription.quota_limit - subscription.quota_used} générations disponibles
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Message pour les non-connectés */}
            {!user && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg text-white text-center">
                <h3 className="text-lg font-bold mb-2">🎁 50 Générations Gratuites !</h3>
                <p className="mb-3 text-sm">Créez un compte pour commencer à générer des vidéos magiques</p>
                <a href="/signup" className="inline-block bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition text-sm">
                  Commencer Gratuitement →
                </a>
              </div>
            )}

            <Card className="border-4 border-purple-200 shadow-2xl overflow-hidden">
              <CardContent className="p-8 md:p-12 bg-gradient-to-br from-white to-purple-50/30">
                {/* Titre de section */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    Créez votre vidéo magique
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Transformez n'importe quelle image en vidéo animée en quelques clics
                  </p>
                </div>

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
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                      Uploadez votre image
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-4 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl aspect-video transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-purple-50 to-blue-50"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl mb-4">
                            <Upload className="w-12 h-12 text-white" />
                          </div>
                          <p className="text-gray-700 font-semibold text-lg">Cliquez pour uploader</p>
                          <p className="text-gray-500 text-sm mt-2">PNG, JPG jusqu'à 10MB</p>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                      Décrivez votre vidéo
                    </label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ex: Une scène paisible avec un mouvement doux de caméra vers la gauche, lumière dorée du coucher de soleil..."
                      className="min-h-[200px] border-4 border-purple-200 focus:border-purple-500 rounded-2xl text-lg p-4 resize-none"
                      disabled={loading}
                    />
                  </div>
                </div>
                {/* Barre de progression pendant génération */}
                {loading && (
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-gray-800">Génération en cours...</span>
                      <span className="text-2xl font-black text-purple-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">✨ Sora AI crée votre vidéo magique...</p>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !imageFile || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-2xl transition-all duration-300 py-8 text-xl font-bold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" /> 
                      Génération en cours... {progress}%
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-3 h-6 w-6" /> 
                      ✨ Générer ma vidéo magique
                    </>
                  )}
                </Button>

                {/* Résultat de la vidéo */}
                {result && (
                  <div className="mt-10">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border-4 border-green-300 mb-4">
                      <p className="text-center font-bold text-green-800 text-xl">
                        🎉 Votre vidéo est prête !
                      </p>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-300">
                      <video 
                        src={result.url} 
                        controls 
                        autoPlay 
                        loop 
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-4 mt-4">
                      <a 
                        href={result.url} 
                        download 
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-center hover:shadow-xl transition"
                      >
                        <Download className="inline-block mr-2 h-5 w-5" />
                        Télécharger
                      </a>
                      <a 
                        href="/dashboard" 
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-center hover:shadow-xl transition"
                      >
                        <Video className="inline-block mr-2 h-5 w-5" />
                        Voir mes vidéos
                      </a>
                    </div>
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
