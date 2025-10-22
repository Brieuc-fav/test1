import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string | null;
  current_period_end: string | null;
  quota_limit: number;
  quota_used: number;
  created_at: string;
  updated_at: string;
}

/**
 * Récupérer l'abonnement d'un utilisateur
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

/**
 * Vérifier si l'utilisateur peut générer une vidéo
 */
export async function canGenerateVideo(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Vérifier si le quota n'est pas dépassé
  if (subscription.quota_used >= subscription.quota_limit) {
    return false;
  }

  // Vérifier si l'abonnement est actif
  if (subscription.status !== 'active' && subscription.status !== null) {
    return false;
  }

  return true;
}

/**
 * Incrémenter le compteur de quota utilisé
 */
export async function incrementQuotaUsed(userId: string): Promise<boolean> {
  try {
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      throw new Error('Aucun abonnement trouvé');
    }

    if (subscription.quota_used >= subscription.quota_limit) {
      throw new Error('Quota épuisé');
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        quota_used: subscription.quota_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating quota:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error incrementing quota:', error);
    return false;
  }
}

/**
 * Créer un abonnement gratuit pour un nouvel utilisateur
 */
export async function createFreeSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        quota_limit: 50,
        quota_used: 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

/**
 * Réinitialiser le quota d'un utilisateur (appelé manuellement ou via webhook)
 */
export async function resetQuota(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        quota_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting quota:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error resetting quota:', error);
    return false;
  }
}
