import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import { jobOffers } from '@/data';
import { ArrowRight, Building2, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  const recentOffers = jobOffers.slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <NavBar />

      {/* Hero Section */}
      <section className="relative bg-[#f5f3ef] py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ef] via-[#faf9f7] to-[#f5f3ef] opacity-70"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-light text-slate-900 mb-8 leading-tight">
              Créateur de rencontres professionnelles
            </h1>
            <p className="text-2xl text-slate-600 mb-4 font-light leading-relaxed">
              Nous accompagnons les candidats et les entreprises pour trouver le match parfait.
            </p>
            <p className="text-lg text-slate-500 mb-12 font-light">
              Chaque histoire est différente, construisons-en une qui vous ressemble.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/register/candidate"
                className="px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 font-light text-lg transition inline-flex items-center justify-center group"
              >
                Je suis candidat
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register/company"
                className="px-10 py-5 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-light text-lg transition inline-flex items-center justify-center group"
              >
                Je suis entreprise
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-light text-slate-900 mb-3">50+</div>
              <div className="text-slate-600 font-light text-lg">Entreprises partenaires</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl font-light text-slate-900 mb-3">500+</div>
              <div className="text-slate-600 font-light text-lg">Candidats qualifiés</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl font-light text-slate-900 mb-3">200+</div>
              <div className="text-slate-600 font-light text-lg">Opportunités actives</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Offers Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-light text-slate-900 mb-6">
              Opportunités professionnelles
            </h2>
            <p className="text-xl text-slate-600 font-light max-w-3xl mx-auto">
              Découvrez les opportunités les plus récentes dans les meilleures entreprises de finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {recentOffers.map((offer) => (
              <JobCard key={offer.id} offer={offer} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/candidate/offers"
              className="inline-flex items-center px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 transition font-light text-lg group"
            >
              Voir toutes les offres
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-light text-slate-900 mb-6">
              Notre vision
            </h2>
            <p className="text-xl text-slate-600 font-light max-w-3xl mx-auto leading-relaxed">
              Le capital humain est la pierre angulaire d'une entreprise. Nous nous engageons à lui accorder toute la place qu'il mérite en mobilisant notre expertise au service de votre projet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="mb-6">
                <Building2 className="h-12 w-12 text-slate-900 mx-auto" strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-light text-slate-900 mb-4">
                Entreprises de renom
              </h3>
              <p className="text-slate-600 font-light leading-relaxed">
                Accédez aux offres des leaders de la finance : banques d'investissement,
                Private Equity, Asset Management
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6">
                <Users className="h-12 w-12 text-slate-900 mx-auto" strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-light text-slate-900 mb-4">
                Profils qualifiés
              </h3>
              <p className="text-slate-600 font-light leading-relaxed">
                Candidats issus des meilleures écoles de commerce et d'ingénieur,
                spécialisés en finance
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6">
                <TrendingUp className="h-12 w-12 text-slate-900 mx-auto" strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-light text-slate-900 mb-4">
                Processus simplifié
              </h3>
              <p className="text-slate-600 font-light leading-relaxed">
                Candidature en quelques clics, suivi en temps réel et gestion facilitée
                des recrutements
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
