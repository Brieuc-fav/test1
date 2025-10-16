import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function DELETE(request: NextRequest) {
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

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID du projet requis' },
        { status: 400 }
      );
    }

    // 1. Récupérer le projet depuis la base de données
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou accès refusé' },
        { status: 404 }
      );
    }

    // 2. Extraire les noms de fichiers des URLs
    const inputImagePath = project.input_image_url?.split('/input-images/').pop();
    const outputVideoPath = project.output_image_url?.split('/output-videos/').pop();

    // 3. Supprimer les fichiers du storage
    if (inputImagePath) {
      const { error: deleteInputError } = await supabaseAdmin.storage
        .from('input-images')
        .remove([inputImagePath]);

      if (deleteInputError) {
        console.error('Error deleting input image:', deleteInputError);
      }
    }

    if (outputVideoPath) {
      const { error: deleteOutputError } = await supabaseAdmin.storage
        .from('output-videos')
        .remove([outputVideoPath]);

      if (deleteOutputError) {
        console.error('Error deleting output video:', deleteOutputError);
      }
    }

    // 4. Supprimer l'entrée de la base de données
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du projet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Projet supprimé avec succès',
    });
  } catch (error) {
    console.error('Error in delete API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
