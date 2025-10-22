import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  try {
    // Créer le client Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // Cookie setting not needed in API routes
          },
        },
      }
    );

    // Récupérer l'utilisateur authentifié
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le customer_id Stripe
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Aucun abonnement trouvé" },
        { status: 404 }
      );
    }

    // Créer une session portal pour gérer l'abonnement
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erreur Stripe portal:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session portal' },
      { status: 500 }
    );
  }
}
