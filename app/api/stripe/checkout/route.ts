import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

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

    // Vérifier si l'utilisateur a déjà un customer_id Stripe
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // Si pas de customer Stripe, en créer un
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Créer ou mettre à jour la subscription dans Supabase
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          quota_limit: 50,
          quota_used: 0,
        });
    }

    // Créer une session Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Erreur Stripe checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la session' },
      { status: 500 }
    );
  }
}
