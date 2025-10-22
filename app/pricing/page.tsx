'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const plans = [
  {
    name: 'Basic',
    price: 9,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_1SIsn6EOx5ILbiaj5zYXl6Z5',
    quota: 50,
    features: [
      '50 générations de vidéos par mois',
      'Qualité HD',
      'Support par email',
      'Stockage cloud sécurisé',
    ],
  },
  {
    name: 'Pro',
    price: 20,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_1SIsqoEOx5ILbiajS4wjfR1q',
    quota: 200,
    popular: true,
    features: [
      '200 générations de vidéos par mois',
      'Qualité HD & 4K',
      'Support prioritaire',
      'Stockage cloud illimité',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoading(priceId);

      // Appeler l'API pour créer une session Checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session');
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
          <p className="text-gray-600 text-lg">
            Déverrouillez tout le potentiel de la génération de vidéos par IA
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? 'border-purple-500 border-2 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                  Populaire
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}€
                    </span>
                    <span className="text-gray-600">/mois</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading !== null}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading === plan.priceId ? 'Chargement...' : 'S\'abonner'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ ou Info supplémentaire */}
        <div className="mt-12 text-center text-gray-600">
          <p>Tous les plans incluent une période d'essai de 7 jours</p>
          <p className="mt-2">Annulez à tout moment • Pas de frais cachés</p>
        </div>
      </div>
    </div>
  );
}
