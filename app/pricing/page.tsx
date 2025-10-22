'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white/20 backdrop-blur-sm border-white/30 text-white text-sm">
            <Sparkles className="w-4 h-4" />
            Plans & Tarifs
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black mb-4 text-white drop-shadow-2xl">
            Choisissez votre plan
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-2xl mx-auto">
            Déverrouillez tout le potentiel de la génération de vidéos par IA ✨
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-yellow-400 border-3 shadow-xl bg-gradient-to-br from-white to-yellow-50' 
                  : 'border-purple-200 border-2 shadow-lg bg-white'
              }`}
            >
              {plan.popular && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500"></div>
                  <Badge className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 text-xs font-bold border-2 border-white shadow-lg">
                    <Crown className="w-3 h-3 mr-1 inline" />
                    LE PLUS POPULAIRE
                  </Badge>
                </>
              )}
              
              <CardHeader className="text-center pb-6 pt-8">
                <div className="mb-3">
                  {plan.popular ? (
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 w-14 h-14 rounded-xl mx-auto flex items-center justify-center">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-14 h-14 rounded-xl mx-auto flex items-center justify-center">
                      <Zap className="w-7 h-7 text-white" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl font-black mb-2">{plan.name}</CardTitle>
                <div className="mt-3">
                  <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {plan.price}€
                  </span>
                  <span className="text-gray-600 text-base">/mois</span>
                </div>
                <p className="text-gray-600 font-semibold mt-2 text-sm">
                  {plan.quota} générations / mois
                </p>
              </CardHeader>
              
              <CardContent className="px-6 pb-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-green-100 rounded-full p-1 mr-2 flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-800 font-medium text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loading !== null}
                  className={`w-full py-6 text-lg font-bold shadow-xl transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:shadow-2xl hover:scale-105'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl hover:scale-105'
                  }`}
                  size="lg"
                >
                  {loading === plan.priceId ? (
                    '⏳ Chargement...'
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      {plan.popular ? 'Choisir le Pro 🚀' : 'Commencer avec Basic'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ ou Info supplémentaire */}
        <div className="mt-16 bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center border-2 border-white/30">
          <h3 className="text-2xl font-bold text-white mb-4">🎁 Offre Spéciale</h3>
          <p className="text-white text-xl mb-2">50 générations offertes pour tout nouveau compte !</p>
          <p className="text-white/80 text-lg">Aucune carte bancaire requise pour commencer</p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-300" />
              <span>Annulation à tout moment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-300" />
              <span>Pas de frais cachés</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-300" />
              <span>Support 7j/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
