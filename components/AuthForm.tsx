'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Video } from 'lucide-react';
import Link from 'next/link';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert('Vérifiez votre email pour confirmer votre inscription !');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      
      <div className="w-full max-w-md relative">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <Video className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Video Magic
            </span>
          </Link>
          <Badge className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Propulsé par Sora AI
          </Badge>
        </div>

        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">
              {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' 
                ? 'Connectez-vous pour continuer à créer des vidéos magiques'
                : 'Rejoignez des milliers de créateurs dès aujourd\'hui'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Adresse email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  className="h-11 border-2"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="h-11 border-2"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Minimum 6 caractères
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    {mode === 'login' ? (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Se connecter
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Créer mon compte
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            {/* Switch Mode */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
              </span>
              {' '}
              <Link 
                href={mode === 'login' ? '/signup' : '/login'}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                {mode === 'login' ? 'Inscrivez-vous' : 'Connectez-vous'}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        {mode === 'signup' && (
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              En vous inscrivant, vous obtenez :
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Vidéos illimitées
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Qualité HD
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Support 24/7
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
