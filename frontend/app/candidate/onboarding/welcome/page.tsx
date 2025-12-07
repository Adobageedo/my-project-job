'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import { CheckCircle2, Sparkles, TrendingUp, Target, ChevronRight } from 'lucide-react';
import { jobOffers } from '@/data';
import { JobOffer } from '@/types';

export default function WelcomePage() {
  const router = useRouter();
  const [recommendedOffers, setRecommendedOffers] = useState<JobOffer[]>([]);

  useEffect(() => {
    // Charger les offres recommandées
    const activeOffers = jobOffers.filter(o => o.status === 'active').slice(0, 6);
    setRecommendedOffers(activeOffers);
  }, []);

  const benefits = [
    {
      icon: Target,
      title: 'Offres personnalisées',
      description: 'Recevez des recommandations basées sur votre profil'
    },
    {
      icon: TrendingUp,
      title: 'Suivi en temps réel',
      description: 'Suivez l\'évolution de vos candidatures'
    },
    {
      icon: Sparkles,
      title: 'Alertes intelligentes',
      description: 'Soyez notifié des nouvelles opportunités'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar role="candidate" />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white mb-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Bienvenue sur JobTeaser !
              </h1>
              
              <p className="text-xl text-blue-100 mb-8">
                Votre compte a été créé avec succès. Découvrez dès maintenant les meilleures opportunités qui correspondent à votre profil.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/candidate/offers')}
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold flex items-center justify-center gap-2"
                >
                  Voir toutes les offres
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push('/candidate/profile')}
                  className="px-8 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition font-semibold"
                >
                  Mon profil
                </button>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Offers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Offres sélectionnées pour vous
                </h2>
                <p className="text-gray-600 mt-1">
                  {recommendedOffers.length} opportunités correspondent à votre profil
                </p>
              </div>
              <button
                onClick={() => router.push('/candidate/offers')}
                className="hidden md:flex items-center gap-2 px-6 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {recommendedOffers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {recommendedOffers.map((offer) => (
                    <JobCard key={offer.id} offer={offer} />
                  ))}
                </div>

                {/* Mobile "Voir tout" button */}
                <div className="md:hidden text-center">
                  <button
                    onClick={() => router.push('/candidate/offers')}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    Voir toutes les offres
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune offre pour le moment
                </h3>
                <p className="text-gray-600 mb-6">
                  Nous recherchons les meilleures opportunités pour vous
                </p>
                <button
                  onClick={() => router.push('/candidate/offers')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Explorer les offres
                </button>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">
              Prêt à trouver votre prochaine opportunité ?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Configurez vos alertes et soyez notifié en temps réel des nouvelles offres qui correspondent à vos critères.
            </p>
            <button
              onClick={() => router.push('/candidate/searches')}
              className="px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold"
            >
              Créer une alerte
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
