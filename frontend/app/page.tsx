'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import { jobOffers } from '@/data';
import { getRecentOffersForHomepage } from '@/services/offerService';
import { getFormattedPlatformStats, FormattedStat } from '@/services/statsService';
import { 
  ArrowRight, 
  Building2, 
  Users, 
  TrendingUp, 
  GraduationCap, 
  Briefcase, 
  Target,
  BookOpen,
  Handshake,
  ExternalLink,
  CheckCircle,
  Zap,
  Award,
  Clock,
  HelpCircle,
  ChevronDown,
  FileText,
  MapPin,
  Calendar,
  Loader2,
} from 'lucide-react';

interface RecentOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  startDate: string | null;
}

// Default stats for initial render and fallback
const DEFAULT_STATS: FormattedStat[] = [
  { key: 'partner_companies', displayValue: '500+', label: 'Entreprises partenaires' },
  { key: 'qualified_candidates', displayValue: '5000+', label: 'Candidats qualifiés' },
  { key: 'active_opportunities', displayValue: '2000+', label: 'Opportunités actives' },
];

export default function Home() {
  const recentOffers = jobOffers.slice(0, 6);
  const [recentOffersTable, setRecentOffersTable] = useState<RecentOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [platformStats, setPlatformStats] = useState<FormattedStat[]>(DEFAULT_STATS);

  useEffect(() => {
    const loadData = async () => {
      // Load recent offers
      try {
        const offers = await getRecentOffersForHomepage(5);
        setRecentOffersTable(offers);
      } catch (error) {
        console.error('Error loading recent offers:', error);
      } finally {
        setIsLoadingOffers(false);
      }

      // Load platform stats
      try {
        const stats = await getFormattedPlatformStats();
        if (stats.length > 0) {
          setPlatformStats(stats);
        }
      } catch (error) {
        console.error('Error loading platform stats:', error);
        // Keep default stats on error
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <NavBar />

      {/* Hero Section */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-light text-slate-900 mb-8 leading-tight">
              Créateur de rencontres professionnelles
            </h1>
            <p className="text-2xl text-slate-600 mb-4 font-light leading-relaxed">
              Conception et déploiement de solutions innovantes en ressources humaines
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
      <section className="py-24 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            {platformStats.map((stat) => (
              <div key={stat.key} className="flex flex-col items-center">
                <div className="text-5xl font-light text-slate-900 mb-3">{stat.displayValue}</div>
                <div className="text-slate-600 font-light text-lg">{stat.label}</div>
              </div>
            ))}
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

          {/* Tableau des 5 offres les plus récentes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Poste</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Entreprise</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Localisation</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Début</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingOffers ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : recentOffersTable.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        Aucune offre disponible pour le moment
                      </td>
                    </tr>
                  ) : (
                    recentOffersTable.map((offer) => (
                      <tr key={offer.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <Link href={`/candidate/offers/${offer.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition">
                            {offer.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {offer.company}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {offer.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            offer.contractType === 'Stage' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {offer.contractType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {offer.startDate 
                              ? new Date(offer.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                              : 'Flexible'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            href={`/candidate/offers/${offer.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
                          >
                            Voir
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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

      {/* Alternance & Stage Banner */}
      <section className="py-24 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/50 rounded-2xl">
                <GraduationCap className="h-12 w-12 text-gray-900" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-2">
                  Recrutez vos alternants et stagiaires en 3 clics
                </h2>
                <p className="text-gray-700 font-light">
                  Spécialistes du recrutement de profils juniors en finance d'entreprise et de marché
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/register/company"
                className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 font-medium transition inline-flex items-center gap-2 rounded-lg"
              >
                <Zap className="h-5 w-5" />
                Publier une offre
              </Link>
            </div>
          </div>

          {/* Quick benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-10 border-t border-gray-300/50">
            <div className="flex items-center gap-3 text-gray-900">
              <CheckCircle className="h-6 w-6 text-gray-700" />
              <span className="font-light">Profils pré-qualifiés des meilleures écoles</span>
            </div>
            <div className="flex items-center gap-3 text-gray-900">
              <Clock className="h-6 w-6 text-gray-700" />
              <span className="font-light">Recrutement en moins de 2 semaines</span>
            </div>
            <div className="flex items-center gap-3 text-gray-900">
              <Award className="h-6 w-6 text-gray-700" />
              <span className="font-light">Accompagnement personnalisé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Entreprises Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-indigo-700 font-medium text-sm uppercase tracking-wider mb-4 block">
                Pour les entreprises
              </span>
              <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
                Services aux entreprises
              </h2>
              <p className="text-xl text-slate-600 font-light mb-8 leading-relaxed">
                Des solutions personnalisables pour répondre à tous vos besoins en recrutement et gestion des talents.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Target className="h-6 w-6 text-indigo-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Chasse & recrutement</h3>
                    <p className="text-slate-600 font-light">Profils finance d'entreprise et de marché, du junior au senior</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Users className="h-6 w-6 text-indigo-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Recrutement externalisé (RPO)</h3>
                    <p className="text-slate-600 font-light">Externalisation complète ou partielle de votre processus de recrutement</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Briefcase className="h-6 w-6 text-indigo-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Évaluation de profils</h3>
                    <p className="text-slate-600 font-light">Assessment et évaluation de vos candidats financiers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <Handshake className="h-6 w-6 text-indigo-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Direction financière à temps partagé</h3>
                    <p className="text-slate-600 font-light">DAF externalisé pour accompagner votre croissance</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="https://berthoisconseils.fr/solutions-entreprises-recrutement"
                  className="px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 transition font-light inline-flex items-center gap-2"
                >
                  Découvrir nos solutions
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
            
            {/* Secteurs d'intervention */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-10 rounded-2xl">
              <h3 className="text-2xl font-light text-slate-900 mb-8">Nos secteurs d'intervention</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Banque & Assurance',
                  'Gestion d\'actifs',
                  'Private Equity',
                  'Industrie',
                  'Services',
                  'Technologie',
                  'Conseil',
                  'Santé',
                  'Luxe',
                  'Télécom',
                  'BTP',
                  'Biomédical',
                ].map((sector) => (
                  <div key={sector} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle className="h-4 w-4 text-indigo-700 flex-shrink-0" />
                    <span className="font-light">{sector}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formations Candidats Section */}
      <section className="py-24 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image/Visual side */}
            <div className="order-2 lg:order-1 bg-gradient-to-br from-sky-500 to-sky-600 p-10 rounded-2xl text-white">
              <h3 className="text-2xl font-light mb-8">Nos formations & coaching</h3>
              
              <div className="space-y-6">
                <div className="bg-white/10 p-6 rounded-xl">
                  <h4 className="font-medium mb-2">Préparation aux entretiens</h4>
                  <p className="text-sky-100 font-light text-sm">
                    Simulation d'entretiens, techniques de présentation et négociation salariale
                  </p>
                </div>
                
                <div className="bg-white/10 p-6 rounded-xl">
                  <h4 className="font-medium mb-2">Optimisation CV & LinkedIn</h4>
                  <p className="text-sky-100 font-light text-sm">
                    Création de CV impactants et profils LinkedIn optimisés pour la finance
                  </p>
                </div>
                
                <div className="bg-white/10 p-6 rounded-xl">
                  <h4 className="font-medium mb-2">Coaching carrière personnalisé</h4>
                  <p className="text-sky-100 font-light text-sm">
                    Accompagnement sur-mesure pour définir et atteindre vos objectifs professionnels
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content side */}
            <div className="order-1 lg:order-2">
              <span className="text-sky-600 font-medium text-sm uppercase tracking-wider mb-4 block">
                Pour les candidats
              </span>
              <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
                Formations & accompagnement
              </h2>
              <p className="text-xl text-slate-600 font-light mb-8 leading-relaxed">
                Vous recherchez une nouvelle opportunité ? Vous avez besoin d'accompagnement dans la gestion de votre carrière ? Découvrez nos offres !
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-sky-600" />
                  <span className="text-slate-700 font-light">Formations adaptées à votre niveau d'expérience</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-sky-600" />
                  <span className="text-slate-700 font-light">Coaching individuel avec des experts du secteur</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-sky-600" />
                  <span className="text-slate-700 font-light">Accès privilégié aux opportunités de carrière</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register/candidate"
                  className="px-8 py-4 bg-sky-600 text-white hover:bg-sky-700 transition font-light inline-flex items-center gap-2"
                >
                  Créer mon profil
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="https://berthoisconseils.fr/nos-formations-and-coaching-candidat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 border border-slate-300 text-slate-700 hover:bg-white transition font-light inline-flex items-center gap-2"
                >
                  Découvrir les formations
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qui sommes-nous Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <span className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-4 block">
              À propos
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
              Qui sommes-nous ?
            </h2>
            <p className="text-xl text-slate-600 font-light leading-relaxed">
              Berthois Conseils propose des solutions de conseil en ressources humaines pour les profils en finance d'entreprise et de marché. Nous avons à cœur de mettre l'expérience candidat au centre de notre démarche tout en nous engageant dans la création de valeur pour nos clients.
            </p>
          </div>

          {/* Notre vision - sous-section */}
          <div className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="mb-6">
                  <Building2 className="h-12 w-12 text-slate-900 mx-auto" strokeWidth={1} />
                </div>
                <h4 className="text-xl font-light text-slate-900 mb-4">
                  Entreprises de renom
                </h4>
                <p className="text-slate-600 font-light leading-relaxed">
                  Accédez aux offres des leaders de la finance : banques d'investissement,
                  Private Equity, Asset Management
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <Users className="h-12 w-12 text-slate-900 mx-auto" strokeWidth={1} />
                </div>
                <h4 className="text-xl font-light text-slate-900 mb-4">
                  Profils qualifiés
                </h4>
                <p className="text-slate-600 font-light leading-relaxed">
                  Candidats issus des meilleures écoles de commerce et d'ingénieur,
                  spécialisés en finance
                </p>
              </div>

              <div className="text-center">
                <div className="mb-6">
                  <TrendingUp className="h-12 w-12 text-slate-900 mx-auto" strokeWidth={1} />
                </div>
                <h4 className="text-xl font-light text-slate-900 mb-4">
                  Processus simplifié
                </h4>
                <p className="text-slate-600 font-light leading-relaxed">
                  Candidature en quelques clics, suivi en temps réel et gestion facilitée
                  des recrutements
                </p>
              </div>
            </div>
          </div>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-slate-900 mb-4">
              Notre vision
            </h3>
            <p className="text-lg text-slate-600 font-light max-w-3xl mx-auto leading-relaxed">
              Le capital humain est la pierre angulaire d'une entreprise. Nous nous engageons à lui accorder toute la place qu'il mérite en mobilisant notre expertise au service de votre projet.
              </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-slate-50 rounded-2xl">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Notre mission</h3>
              <p className="text-slate-600 font-light">
                Créer un acteur de référence dans la gestion des ressources humaines en finance, géré par des financiers pour des financiers.
              </p>
            </div>
            
            <div className="text-center p-8 bg-slate-50 rounded-2xl">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Notre approche</h3>
              <p className="text-slate-600 font-light">
                Le capital humain est la pierre angulaire d'une entreprise. Nous nous engageons à lui accorder toute la place qu'il mérite.
              </p>
            </div>
            
            <div className="text-center p-8 bg-slate-50 rounded-2xl">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Notre engagement</h3>
              <p className="text-slate-600 font-light">
                Mobiliser notre expertise au service de votre projet pour construire un monde professionnel adapté aux besoins de chacun.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <a
              href="https://berthoisconseils.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white hover:bg-slate-800 transition font-light text-lg group"
            >
              Découvrir Berthois Conseils
              <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
