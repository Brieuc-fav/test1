'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Sparkles, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';

type Status = 'idle' | 'uploading' | 'generating' | 'success' | 'error';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [inputImageUrl, setInputImageUrl] = useState<string>('');
  const [outputVideoUrl, setOutputVideoUrl] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setInputImageUrl(previewUrl);
      setOutputVideoUrl('');
      setStatus('idle');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file || !prompt.trim()) {
      setStatus('error');
      setStatusMessage('Veuillez sélectionner une image et entrer un prompt');
      return;
    }

    try {
      setStatus('uploading');
      setStatusMessage("Upload de l'image en cours...");
      setOutputVideoUrl('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);

      setStatus('generating');
      setStatusMessage('Génération de la vidéo avec Sora... Cela peut prendre 1-2 minutes.');

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setStatus('success');
      setStatusMessage('Vidéo générée avec succès !');
      setOutputVideoUrl(data.outputVideoUrl);
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Erreur lors de la génération'
      );
      console.error('Error:', error);
    }
  };

  const isLoading = status === 'uploading' || status === 'generating';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 space-y-4">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Propulsé par Sora AI
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Créez des vidéos magiques
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transformez vos images en vidéos captivantes en quelques secondes avec l'intelligence artificielle
          </p>
        </div>

        <Card className="max-w-4xl mx-auto mb-12 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Nouvelle génération
            </CardTitle>
            <CardDescription>
              Choisissez une image et décrivez l'animation souhaitée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="file-upload" className="text-sm font-medium">
                  Image source
                </label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {file.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Description de l'animation
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Décrivez comment vous voulez animer l'image... Ex: Make this image come to life with subtle movement"
                  disabled={isLoading}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {status !== 'idle' && (
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  status === 'error' ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                  status === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                  'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {status === 'error' && <AlertCircle className="w-5 h-5" />}
                  <span className="font-medium">{statusMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !file || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer la vidéo
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Image d'entrée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {inputImageUrl ? (
                  <Image
                    src={inputImageUrl}
                    alt="Input"
                    width={600}
                    height={600}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune image sélectionnée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center justify-between">
                Vidéo générée
                {outputVideoUrl && <Badge variant="secondary">2s</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {outputVideoUrl ? (
                  <video
                    src={outputVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="max-w-full max-h-full rounded-lg"
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{isLoading ? 'Génération...' : 'Vidéo à venir'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
