import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/job/JobCard';
import { jobOffers } from '@/data';
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
} from 'lucide-react';

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

      {/* Alternance & Stage Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl">
                <GraduationCap className="h-12 w-12 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-light text-white mb-2">
                  Recrutez vos alternants et stagiaires en 3 clics
                </h2>
                <p className="text-blue-100 font-light">
                  Spécialistes du recrutement de profils juniors en finance d'entreprise et de marché
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                href="/register/company"
                className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-medium transition inline-flex items-center gap-2 rounded-lg"
              >
                <Zap className="h-5 w-5" />
                Publier une offre
              </Link>
            </div>
          </div>
          
          {/* Quick benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-10 border-t border-white/20">
            <div className="flex items-center gap-3 text-white">
              <CheckCircle className="h-6 w-6 text-blue-200" />
              <span className="font-light">Profils pré-qualifiés des meilleures écoles</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Clock className="h-6 w-6 text-blue-200" />
              <span className="font-light">Recrutement en moins de 2 semaines</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Award className="h-6 w-6 text-blue-200" />
              <span className="font-light">Accompagnement personnalisé</span>
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

      {/* Services Entreprises Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-medium text-sm uppercase tracking-wider mb-4 block">
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
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Chasse & recrutement</h3>
                    <p className="text-slate-600 font-light">Profils finance d'entreprise et de marché, du junior au senior</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Recrutement externalisé (RPO)</h3>
                    <p className="text-slate-600 font-light">Externalisation complète ou partielle de votre processus de recrutement</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Évaluation de profils</h3>
                    <p className="text-slate-600 font-light">Assessment et évaluation de vos candidats financiers</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Handshake className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Direction financière à temps partagé</h3>
                    <p className="text-slate-600 font-light">DAF externalisé pour accompagner votre croissance</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register/company"
                  className="px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 transition font-light inline-flex items-center gap-2"
                >
                  Découvrir nos solutions
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="https://berthoisconseils.fr/solutions-entreprises-recrutement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-light inline-flex items-center gap-2"
                >
                  En savoir plus
                  <ExternalLink className="h-4 w-4" />
                </a>
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
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
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
            <div className="order-2 lg:order-1 bg-gradient-to-br from-emerald-500 to-emerald-600 p-10 rounded-2xl text-white">
              <h3 className="text-2xl font-light mb-8">Nos formations & coaching</h3>
              
              <div className="space-y-6">
                <div className="bg-white/10 p-6 rounded-xl">
                  <h4 className="font-medium mb-2">Préparation aux entretiens</h4>
                  <p className="text-emerald-100 font-light text-sm">
                    Simulation d'entretiens, techniques de présentation et négociation salariale
                  </p>
                </div>
                
                <div className="bg-white/10 p-6 rounded-xl">
                  <h4 className="font-medium mb-2">Optimisation CV & LinkedIn</h4>
                  <p className="text-emerald-100 font-light text-sm">
                    Création de CV impactants et profils LinkedIn optimisés pour la finance
                  </p>
                </div>
                
                <div className="bg-white/10 p-6 rounded-xl">
                  <h4 className="font-medium mb-2">Coaching carrière personnalisé</h4>
                  <p className="text-emerald-100 font-light text-sm">
                    Accompagnement sur-mesure pour définir et atteindre vos objectifs professionnels
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content side */}
            <div className="order-1 lg:order-2">
              <span className="text-emerald-600 font-medium text-sm uppercase tracking-wider mb-4 block">
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
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <span className="text-slate-700 font-light">Formations adaptées à votre niveau d'expérience</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <span className="text-slate-700 font-light">Coaching individuel avec des experts du secteur</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="text-slate-700 font-light">Accès privilégié aux opportunités de carrière</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register/candidate"
                  className="px-8 py-4 bg-emerald-600 text-white hover:bg-emerald-700 transition font-light inline-flex items-center gap-2"
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

      {/* FAQ Section */}
      <section className="py-24 bg-[#f5f3ef]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-medium text-sm uppercase tracking-wider mb-4 block">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
              Questions fréquentes
            </h2>
            <p className="text-xl text-slate-600 font-light">
              Tout ce que vous devez savoir sur notre plateforme
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Comment fonctionne le recrutement de stagiaires et alternants ?",
                answer: "Notre plateforme vous permet de publier vos offres en quelques clics. Les candidats postulent directement, vous recevez leurs candidatures dans votre espace, et vous pouvez gérer le processus de A à Z avec notre système de suivi intégré."
              },
              {
                question: "Quels sont les profils disponibles sur la plateforme ?",
                answer: "Nous sommes spécialisés dans les profils finance : analystes, contrôleurs de gestion, auditeurs, traders juniors... Les candidats sont issus des meilleures écoles de commerce et d'ingénieur françaises."
              },
              {
                question: "Combien coûte la publication d'une offre ?",
                answer: "La publication d'offres de stage et d'alternance est gratuite. Pour les CDI et les services premium (chasse, RPO, évaluation), contactez-nous pour un devis personnalisé."
              },
              {
                question: "Comment accompagnez-vous les candidats ?",
                answer: "Nous proposons des formations et du coaching : préparation aux entretiens, optimisation CV et LinkedIn, et accompagnement carrière personnalisé pour maximiser vos chances de réussite."
              },
              {
                question: "Quel est le délai moyen de recrutement ?",
                answer: "Grâce à notre vivier de candidats pré-qualifiés, le délai moyen est de 2 semaines entre la publication de l'offre et la proposition d'embauche."
              },
            ].map((faq, index) => (
              <details 
                key={index}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-medium text-slate-900 pr-4">{faq.question}</span>
                  <ChevronDown className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-slate-600 font-light leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-medium text-sm uppercase tracking-wider mb-4 block">
              Blog
            </span>
            <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-6">
              Actualités & Conseils
            </h2>
            <p className="text-xl text-slate-600 font-light">
              Restez informé des tendances du recrutement en finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Comment réussir son entretien en finance de marché",
                excerpt: "Les clés pour impressionner les recruteurs et décrocher le poste de vos rêves dans le secteur financier.",
                category: "Candidats",
                date: "15 Nov 2024",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop"
              },
              {
                title: "Recruter en alternance : les bonnes pratiques",
                excerpt: "Guide complet pour les entreprises souhaitant intégrer des alternants dans leurs équipes finance.",
                category: "Entreprises",
                date: "10 Nov 2024",
                image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop"
              },
              {
                title: "Les métiers de la finance qui recrutent en 2025",
                excerpt: "Panorama des opportunités et des compétences les plus recherchées dans le secteur financier.",
                category: "Tendances",
                date: "5 Nov 2024",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop"
              },
            ].map((article, index) => (
              <article 
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition group"
              >
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      {article.category}
                    </span>
                    <span className="text-sm text-gray-500">{article.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition">
                    {article.title}
                  </h3>
                  <p className="text-slate-600 font-light text-sm mb-4">
                    {article.excerpt}
                  </p>
                  <a 
                    href="#"
                    className="text-emerald-600 font-medium text-sm inline-flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Lire la suite
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-8 py-4 border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-light"
            >
              <FileText className="h-5 w-5" />
              Voir tous les articles
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
