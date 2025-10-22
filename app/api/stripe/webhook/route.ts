import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fonction helper pour obtenir la limite de quota selon le price ID
function getQuotaLimit(priceId: string): number {
  if (priceId === process.env.STRIPE_PRICE_BASIC) {
    return 50;
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    return 200;
  }
  return 50; // Par défaut
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Pas de signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Erreur de vérification webhook:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Gérer les différents types d'événements
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.subscription) {
          break;
        }

        // Récupérer la subscription Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const userId = session.metadata?.user_id;
        if (!userId) {
          throw new Error('user_id manquant dans les metadata');
        }

        const priceId = stripeSubscription.items.data[0].price.id;
        const quotaLimit = getQuotaLimit(priceId);

        // Mettre à jour la subscription dans Supabase
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: stripeSubscription.id,
            stripe_price_id: priceId,
            status: stripeSubscription.status,
            current_period_end: new Date(
              (stripeSubscription as any).current_period_end * 1000
            ).toISOString(),
            quota_limit: quotaLimit,
            quota_used: 0,
            updated_at: new Date().toISOString(),
          });

        console.log('✅ Abonnement créé:', stripeSubscription.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const priceId = subscription.items.data[0].price.id;
        const quotaLimit = getQuotaLimit(priceId);

        await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_end: new Date(
              (subscription as any).current_period_end * 1000
            ).toISOString(),
            quota_limit: quotaLimit,
            quota_used: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('✅ Abonnement mis à jour:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        console.log('✅ Abonnement annulé:', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        
        if (subscriptionId && typeof subscriptionId === 'string') {
          await supabase
            .from('subscriptions')
            .update({
              quota_used: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          console.log('✅ Quota réinitialisé après paiement:', subscriptionId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        
        if (subscriptionId && typeof subscriptionId === 'string') {
          await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          console.log('⚠️ Paiement échoué:', subscriptionId);
        }
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}
