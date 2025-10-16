'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Play, Calendar, Loader2 } from 'lucide-react';

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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="relative h-56 bg-muted cursor-pointer group"
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
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <Play className="w-8 h-8" />
                <span className="font-medium">Voir la vidéo</span>
              </div>
            </div>
          </>
        )}
        
        <Badge className="absolute top-3 right-3" variant="secondary">
          2s
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{formatDate(createdAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{prompt}</p>
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild variant="default" size="sm" className="flex-1">
          <a href={outputVideoUrl} download>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </a>
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="destructive"
          size="sm"
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
