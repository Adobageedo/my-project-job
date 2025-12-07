'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Démarrer le compte à rebours
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirection automatique vers la page de connexion
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Icône de succès */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>

            {/* Titre */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Vérifiez votre boîte mail
              </h1>
              <p className="text-gray-600">
                Un e-mail de confirmation a été envoyé à votre adresse.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Prochaines étapes :</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Ouvrez votre boîte mail</li>
                    <li>Cliquez sur le lien de confirmation</li>
                    <li>Connectez-vous avec vos identifiants</li>
                    <li>Complétez votre profil</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Compte à rebours */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
                <span className="text-sm text-gray-700">
                  Redirection automatique dans <span className="font-bold text-blue-600">{countdown}</span> secondes
                </span>
              </div>
            </div>

            {/* Bouton manuel */}
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold"
            >
              Aller à la page de connexion
            </button>

            {/* Info supplémentaire */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous n'avez pas reçu l'email ?{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Renvoyer l'email
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
