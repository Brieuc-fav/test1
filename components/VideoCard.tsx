'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Play, Calendar, Loader2, Sparkles, Video as VideoIcon } from 'lucide-react';

interface VideoCardProps {
  id: string;
  prompt: string;
  inputImageUrl: string;
  outputVideoUrl: string;
  createdAt: string;
  onDelete?: (id: string) => void;
}

export default function VideoCard({
  id,
  prompt,
  inputImageUrl,
  outputVideoUrl,
  createdAt,
  onDelete,
}: VideoCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      if (onDelete) onDelete(id);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card 
      className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="relative h-56 bg-gradient-to-br from-secondary/20 to-secondary/40 cursor-pointer overflow-hidden"
        onClick={() => setShowVideo(!showVideo)}
      >
        {showVideo ? (
          <video
            src={outputVideoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-cover"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        ) : (
          <>
            <img
              src={inputImageUrl}
              alt="Preview"
              className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
                    <Play className="w-8 h-8 fill-white" />
                  </div>
                </div>
                <span className="font-semibold text-lg mt-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Voir la vidéo
                </span>
              </div>
            </div>
          </>
        )}
        
        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
          <VideoIcon className="w-3 h-3 mr-1" />
          2s
        </Badge>
      </div>

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-medium">{formatDate(createdAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {prompt}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0 border-t bg-secondary/5 p-4">
        <Button 
          asChild 
          variant="default" 
          size="sm" 
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
        >
          <a href={outputVideoUrl} download>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </a>
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="outline"
          size="sm"
          className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
