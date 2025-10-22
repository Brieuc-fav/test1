import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { generateVideo } from '@/lib/sora';
import { v4 as uuidv4 } from 'uuid';
import { canGenerateVideo, incrementQuotaUsed, createFreeSubscription } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le quota de l'utilisateur
    console.log('🔍 Checking user quota...');
    let canGenerate = await canGenerateVideo(user.id);
    
    // Si l'utilisateur n'a pas d'abonnement, créer un abonnement gratuit
    if (canGenerate === false) {
      console.log('📝 User has no subscription, creating free subscription...');
      const newSubscription = await createFreeSubscription(user.id);
      
      if (newSubscription) {
        console.log('✅ Free subscription created');
        canGenerate = true;
      } else {
        return NextResponse.json(
          { error: 'Impossible de créer l\'abonnement' },
          { status: 500 }
        );
      }
    }

    if (!canGenerate) {
      console.log('❌ Quota exceeded for user:', user.id);
      return NextResponse.json(
        { 
          error: 'Quota épuisé',
          message: 'Vous avez atteint votre limite de générations pour ce mois. Passez à un plan supérieur pour continuer.',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    console.log('✅ Quota OK, proceeding with generation...');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prompt = formData.get('prompt') as string;

    if (!file || !prompt) {
      return NextResponse.json(
        { error: 'Image et prompt requis' },
        { status: 400 }
      );
    }

    // 1. Upload de l'image d'entrée dans Supabase avec le user_id dans le chemin
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('input-images')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload de l\'image' },
        { status: 500 }
      );
    }

    // 2. Récupérer l'URL publique de l'image uploadée
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('input-images')
      .getPublicUrl(fileName);

    const inputImageUrl = publicUrlData.publicUrl;

    // 3. Lire le fichier pour l'envoyer à Sora en image-to-video
    console.log('📸 Preparing image for Sora image-to-video generation...');
    const imageBlob = new Blob([fileBuffer], { type: file.type });

    // 4. Enrichir le prompt avec des instructions pour des animations rapides et dynamiques
    const enhancedPrompt = `${prompt.trim()}. Fast-paced dynamic motion, quick movements, energetic animation, rapid action, high-speed camera movements, dynamic transitions.`;
    
    console.log('Calling Sora with image-to-video mode');
    console.log('Image filename:', fileName);
    console.log('User prompt:', prompt);
    console.log('Enhanced prompt:', enhancedPrompt);

    // 5. Appeler Sora pour générer la vidéo de 2 secondes en mode image-to-video
    const videoUrl = await generateVideo({
      prompt: enhancedPrompt,
      height: 1080,
      width: 1080,
      n_seconds: 2,
      n_variants: 1,
      imageFile: imageBlob,
      imageFileName: fileName.split('/').pop()!, // Juste le nom du fichier sans le user_id
    });

    console.log('Sora video URL:', videoUrl);

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Aucune vidéo générée par Sora' },
        { status: 500 }
      );
    }

    // 5. Télécharger la vidéo générée
    console.log('📥 Downloading video from Sora URL:', videoUrl);
    
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'Api-key': process.env.AZURE_API_KEY!,
      },
    });
    
    console.log('📥 Video download response status:', videoResponse.status);
    console.log('📥 Video download content-type:', videoResponse.headers.get('content-type'));
    console.log('📥 Video download content-length:', videoResponse.headers.get('content-length'));
    
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('❌ Failed to download generated video:', videoResponse.status, errorText);
      return NextResponse.json({ 
        error: `Erreur lors du téléchargement de la vidéo générée (${videoResponse.status}): ${errorText}` 
      }, { status: 500 });
    }

    const videoArrayBuffer = await videoResponse.arrayBuffer();
    console.log('📥 Downloaded video size:', videoArrayBuffer.byteLength, 'bytes');
    
    // Supabase storage in Node expects a Buffer/Uint8Array for binary uploads
    const videoBuffer = new Uint8Array(videoArrayBuffer);
    console.log('📥 Converted to Uint8Array, size:', videoBuffer.length, 'bytes');

    // 6. Upload de la vidéo générée dans output-videos avec le user_id dans le chemin
    const outputFileName = `${user.id}/${uuidv4()}.mp4`;
    console.log('📤 Uploading video to Supabase bucket "output-videos" with filename:', outputFileName);
    console.log('📤 Video buffer size:', videoBuffer.length, 'bytes');
    
    const { data: outputUploadData, error: outputUploadError } = await supabaseAdmin.storage
      .from('output-videos')
      .upload(outputFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (outputUploadError) {
      console.error('❌ Output upload error:', JSON.stringify(outputUploadError, null, 2));
      console.error('❌ Output upload data:', JSON.stringify(outputUploadData, null, 2));
      console.error('❌ Supabase URL:', process.env.SUPABASE_URL);
      console.error('❌ Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes (redacted)' : 'No');
      return NextResponse.json(
        { error: `Erreur lors de la sauvegarde de la vidéo générée: ${outputUploadError.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ Video uploaded successfully to Supabase:', outputFileName);

    // 7. Récupérer l'URL publique de la vidéo générée
    console.log('🔗 Getting public URL for:', outputFileName);
    const outputPublicUrlResult = await supabaseAdmin.storage
      .from('output-videos')
      .getPublicUrl(outputFileName);

    let outputVideoUrl = outputPublicUrlResult.data?.publicUrl;
    console.log('🔗 Public URL retrieved:', outputVideoUrl);

    // If public URL is not available or will 404 (private bucket), create a signed URL fallback
    if (!outputVideoUrl) {
      console.log('⚠️ Public URL not available, creating signed URL...');
      const signedResult = await supabaseAdmin.storage
        .from('output-videos')
        .createSignedUrl(outputFileName, 60 * 60); // 1 hour

      if (signedResult.error) {
        console.error('❌ Failed to create signed URL for output video:', signedResult.error);
      } else {
        outputVideoUrl = signedResult.data?.signedUrl || outputVideoUrl;
        console.log('✅ Signed URL created:', outputVideoUrl);
      }
    }

    // 8. Sauvegarder dans la table projects avec le user_id
    console.log('💾 Saving project to database...');
    const { error: dbError } = await supabaseAdmin
      .from('projects')
      .insert({
        user_id: user.id,
        input_image_url: inputImageUrl,
        output_image_url: outputVideoUrl, // Stocke l'URL de la vidéo
        prompt: prompt,
        status: 'completed',
      });

    if (dbError) {
      console.error('❌ Database error:', JSON.stringify(dbError, null, 2));
      // Continue même si l'insertion échoue
    } else {
      console.log('✅ Project saved to database');
    }

    // 9. Incrémenter le quota utilisé
    console.log('📊 Incrementing quota for user:', user.id);
    const quotaUpdated = await incrementQuotaUsed(user.id);
    
    if (!quotaUpdated) {
      console.error('⚠️ Failed to increment quota, but video was generated successfully');
    } else {
      console.log('✅ Quota incremented successfully');
    }

    // 10. Retourner l'URL de la vidéo générée
    console.log('✅ Generation complete! Returning URLs...');
    console.log('   Input image:', inputImageUrl);
    console.log('   Output video:', outputVideoUrl);
    return NextResponse.json({
      success: true,
      inputImageUrl,
      outputVideoUrl,
    });
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
