/**
 * Client pour interagir avec Azure Sora API
 */

const AZURE_API_KEY = process.env.AZURE_API_KEY!;
const AZURE_SORA_ENDPOINT = process.env.AZURE_SORA_ENDPOINT!;

export interface SoraGenerationParams {
  prompt: string;
  height?: number;
  width?: number;
  n_seconds?: number;
  n_variants?: number;
  imageFile?: Blob;
  imageFileName?: string;
}

export interface SoraJobResponse {
  id?: string;
  status?: string;
  failure_reason?: string;
  generations?: Array<{
    object?: string;
    id?: string;
    url?: string;
    content?: Array<{
      url?: string;
    }>;
  }>;
  result?: {
    data?: Array<{
      url?: string;
    }>;
  };
  error?: {
    message?: string;
    code?: string;
  };
  [key: string]: any; // Pour capturer d'autres propriétés
}

/**
 * Convertit les codes d'erreur Sora en messages lisibles
 */
function getFailureReasonMessage(failureReason: string): string {
  const errorMessages: Record<string, string> = {
    'face_upload_not_allowed': '❌ Les images contenant des visages ne sont pas autorisées pour des raisons de sécurité. Veuillez utiliser une image sans visage visible.',
    'content_policy_violation': '❌ Le contenu de votre image ou prompt viole la politique d\'utilisation.',
    'image_too_large': '❌ L\'image est trop volumineuse. Veuillez utiliser une image plus petite.',
    'invalid_image_format': '❌ Format d\'image non valide. Utilisez JPG ou PNG.',
    'prompt_too_long': '❌ Le prompt est trop long. Veuillez le raccourcir.',
    'rate_limit_exceeded': '❌ Trop de requêtes. Veuillez réessayer dans quelques minutes.',
    'insufficient_quota': '❌ Quota insuffisant. Veuillez vérifier votre abonnement Azure.',
  };

  return errorMessages[failureReason] || `❌ Erreur: ${failureReason}`;
}

/**
 * Génère une vidéo avec Sora à partir d'un prompt et optionnellement d'une image
 */
export async function generateVideo(params: SoraGenerationParams): Promise<string> {
  const {
    prompt,
    height = 1080,
    width = 1080,
    n_seconds = 1,
    n_variants = 1,
    imageFile,
    imageFileName,
  } = params;

  console.log('🎬 Sora - Creating video generation job...');
  console.log('Endpoint:', AZURE_SORA_ENDPOINT);
  console.log('Params:', { prompt, height, width, n_seconds, n_variants, hasImage: !!imageFile });

  let response: Response;

  // 1. Créer le job de génération
  if (imageFile && imageFileName) {
    // Image-to-video: utiliser multipart/form-data avec inpaint_items
    console.log('🎬 Sora - Using image-to-video mode with inpaint_items');
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('height', height.toString());
    formData.append('width', width.toString());
    formData.append('n_seconds', n_seconds.toString());
    formData.append('n_variants', n_variants.toString());
    formData.append('model', 'sora');
    
    // Ajouter les inpaint_items pour spécifier l'image de départ
    const inpaintItems = JSON.stringify([
      {
        frame_index: 0, // Image au début de la vidéo
        type: 'image',
        file_name: imageFileName,
        crop_bounds: {
          left_fraction: 0.0,
          top_fraction: 0.0,
          right_fraction: 1.0,
          bottom_fraction: 1.0,
        },
      },
    ]);
    formData.append('inpaint_items', inpaintItems);
    
    // Ajouter le fichier image
    formData.append('files', imageFile, imageFileName);
    
    // Pour multipart/form-data, ne pas spécifier Content-Type (le navigateur le fait)
    response = await fetch(AZURE_SORA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Api-key': AZURE_API_KEY,
        // Pas de Content-Type ici, FormData le gère automatiquement
      },
      body: formData,
    });
  } else {
    // Text-to-video: utiliser JSON classique
    console.log('🎬 Sora - Using text-to-video mode');
    
    response = await fetch(AZURE_SORA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-key': AZURE_API_KEY,
      },
      body: JSON.stringify({
        model: 'sora',
        prompt,
        height,
        width,
        n_seconds,
        n_variants,
      }),
    });
  }

  const responseText = await response.text();
  console.log('🎬 Sora - Response status:', response.status);
  console.log('🎬 Sora - Response body:', responseText);

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch (e) {
      // Si le parsing JSON échoue, utiliser le texte brut
      errorMessage = responseText || errorMessage;
    }
    throw new Error(`Sora API error (${response.status}): ${errorMessage}`);
  }

  let jobData: SoraJobResponse;
  try {
    jobData = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse Sora response: ${responseText}`);
  }

  console.log('🎬 Sora - Job data:', JSON.stringify(jobData, null, 2));

  const jobId = jobData.id;
  if (!jobId) {
    throw new Error(`No job ID returned from Sora API. Response: ${JSON.stringify(jobData)}`);
  }

  console.log('🎬 Sora - Job created with ID:', jobId);

  // 2. Attendre que le job soit terminé (polling)
  const videoUrl = await pollJobStatus(jobId);
  return videoUrl;
}

/**
 * Vérifie le statut du job jusqu'à ce qu'il soit terminé
 */
async function pollJobStatus(jobId: string, maxAttempts = 60): Promise<string> {
  // AZURE_SORA_ENDPOINT = https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
  // On veut: https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs/{jobId}?api-version=preview
  const baseEndpoint = AZURE_SORA_ENDPOINT.split('?')[0]; // Enlève les query params
  const pollEndpoint = `${baseEndpoint}/${jobId}?api-version=preview`;
  
  console.log('🎬 Sora - Starting to poll job status...');
  console.log('Poll endpoint:', pollEndpoint);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`🎬 Sora - Poll attempt ${attempt + 1}/${maxAttempts}`);

    const response = await fetch(pollEndpoint, {
      method: 'GET',
      headers: {
        'Api-key': AZURE_API_KEY,
      },
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('🎬 Sora - Poll failed:', response.status, responseText);
      throw new Error(`Failed to poll job status (${response.status}): ${responseText}`);
    }

    let jobData: SoraJobResponse;
    try {
      jobData = JSON.parse(responseText);
    } catch (e) {
      console.error('🎬 Sora - Failed to parse poll response:', responseText);
      throw new Error(`Failed to parse poll response: ${responseText}`);
    }

    console.log(`🎬 Sora - Job status: ${jobData.status}`);
    console.log('🎬 Sora - Full job data:', JSON.stringify(jobData, null, 2));

    if (jobData.status === 'failed') {
      const failureReason = jobData.failure_reason || 'Unknown error';
      console.log('🎬 Sora - Job failed:', {
        errorCode: failureReason,
        errorMessage: getFailureReasonMessage(failureReason),
        fullError: jobData.failure_reason
      });
      throw new Error(`Video generation failed: ${getFailureReasonMessage(failureReason)}`);
    }

    if (jobData.status === 'succeeded') {
      console.log('🎬 Sora - Job succeeded! Waiting for video to be fully ready...');
      // Wait a few seconds to ensure video is available for download
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Essayer plusieurs chemins possibles pour l'URL de la vidéo
      let videoUrl: string | undefined;

      // Chemin 1 : generations[0].url
      if (jobData.generations?.[0]?.url) {
        videoUrl = jobData.generations[0].url;
      }
      // Chemin 2 : generations[0].content[0].url
      else if (jobData.generations?.[0]?.content?.[0]?.url) {
        videoUrl = jobData.generations[0].content[0].url;
      }
      // Chemin 3 : result.data[0].url (format OpenAI standard)
      else if (jobData.result?.data?.[0]?.url) {
        videoUrl = jobData.result.data[0].url;
      }
      // Chemin 4 : Il faut récupérer la vidéo via l'ID de génération
      else if (jobData.generations?.[0]?.id) {
        const generationId = jobData.generations[0].id;
        console.log(`🎬 Sora - No direct URL, fetching generation ${generationId}...`);
        videoUrl = await fetchGenerationContent(generationId);
      }

      if (videoUrl) {
        console.log('🎬 Sora - Video generated successfully:', videoUrl);
        return videoUrl;
      }
      
      throw new Error(`Job succeeded but no video URL found. Response: ${JSON.stringify(jobData)}`);
    }

    // Si le status est "running" ou "pending", continuer à attendre
    if (jobData.status === 'running' || jobData.status === 'pending' || jobData.status === 'preprocessing') {
      console.log(`🎬 Sora - Job is ${jobData.status}, waiting 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    // Status inattendu
    console.warn(`🎬 Sora - Unexpected status: ${jobData.status}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error(`Video generation timeout - job took too long (${maxAttempts * 2} seconds)`);
}

/**
 * Récupère l'URL de la vidéo à partir de l'ID de génération
 */
async function fetchGenerationContent(generationId: string): Promise<string> {
  // AZURE_SORA_ENDPOINT = https://bapti-m70vyuu5-eastus2.openai.azure.com/openai/v1/video/generations/jobs?api-version=preview
  // Extraire la base URL (avant /video/generations/jobs)
  const endpointWithoutParams = AZURE_SORA_ENDPOINT.split('?')[0];
  const baseUrl = endpointWithoutParams.replace(/\/video\/generations\/jobs\/?$/, '');
  
  // Selon la doc Microsoft: /video/generations/{generation_id}/content/video
  const videoContentUrl = `${baseUrl}/video/generations/${generationId}/content/video?api-version=preview`;
  console.log(`🎬 Sora - Video content URL: ${videoContentUrl}`);
  
  return videoContentUrl;
}
