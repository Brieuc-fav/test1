'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';

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
      // Create preview URL for input image
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
      setStatusMessage('Upload de l\'image en cours...');
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
    <div className="container">
      <header className="header">
        <h1>🎬 Video Magic</h1>
        <p>Transformez vos images en vidéos avec Sora AI</p>
      </header>

      <div className="main-content">
        <section className="upload-section">
          <h2>📤 Upload & Configuration</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="file-input">Sélectionnez une image</label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prompt-input">
                Décrivez l&apos;animation ou la transformation souhaitée
              </label>
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Make this image come to life with subtle movement, add animation to the scene..."
                className="textarea"
                disabled={isLoading}
              />
            </div>

            {status !== 'idle' && (
              <div className={`status-message ${status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}`}>
                {isLoading && <span className="loading-spinner"></span>}
                {' '}{statusMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn-generate"
              disabled={isLoading || !file || !prompt.trim()}
            >
              {isLoading ? 'Génération en cours...' : '🎬 Générer la vidéo (2s)'}
            </button>
          </form>
        </section>

        <div className="results-section">
          <div className="result-panel">
            <h3>
              <span>📷</span> Image d&apos;entrée
            </h3>
            <div className="image-container">
              {inputImageUrl ? (
                <Image
                  src={inputImageUrl}
                  alt="Image d'entrée"
                  width={600}
                  height={600}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              ) : (
                <div className="empty-state">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>Aucune image sélectionnée</p>
                </div>
              )}
            </div>
          </div>

          <div className="result-panel">
            <h3>
              <span>🎬</span> Vidéo générée (2s)
            </h3>
            <div className="image-container">
              {outputVideoUrl ? (
                <video
                  src={outputVideoUrl}
                  controls
                  autoPlay
                  loop
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px' }}
                >
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              ) : (
                <div className="empty-state">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p>
                    {isLoading
                      ? 'Génération en cours...'
                      : 'Votre vidéo générée apparaîtra ici'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
