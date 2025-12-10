'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const [verified, setVerified] = useState(false);

  // Auto-polling pour détecter la validation (max 10 fois)
  useEffect(() => {
    if (pollCount >= 10 || verified) return;

    const checkEmailVerified = async () => {
      setIsChecking(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email_confirmed_at) {
          setVerified(true);
          // Rediriger vers l'onboarding candidat après vérification de l'email
          setTimeout(() => {
            router.push('/candidate/onboarding?verified=true');
          }, 2000);
        }
      } catch (error) {
        console.error('Erreur vérification:', error);
      } finally {
        setIsChecking(false);
      }
    };

    const interval = setInterval(() => {
      checkEmailVerified();
      setPollCount(prev => prev + 1);
    }, 3000);

    // Premier check immédiat
    checkEmailVerified();

    return () => clearInterval(interval);
  }, [pollCount, verified, router]);

  // Cooldown pour le bouton "Renvoyer"
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      // Cooldown de 60 secondes
      setResendCooldown(60);
      setPollCount(0); // Reset le polling
    } catch (error: any) {
      console.error('Erreur renvoi email:', error);
      alert(error.message || 'Erreur lors du renvoi de l\'email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          {verified ? (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {verified ? 'Email vérifié !' : 'Vérifiez votre email'}
          </h1>
          <p className="text-gray-600">
            {verified ? (
              'Redirection vers la page de connexion...'
            ) : (
              <>
                Nous avons envoyé un lien de confirmation à<br />
                <span className="font-semibold text-blue-600">{email}</span>
              </>
            )}
          </p>
        </div>

        {!verified && (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-blue-900 font-medium">
                Pour continuer :
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Ouvrez votre boîte mail</li>
                <li>Cliquez sur le lien de confirmation</li>
                <li>Revenez ici pour vous connecter</li>
              </ol>
            </div>

            {/* Checking status */}
            {isChecking && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Vérification en cours...</span>
              </div>
            )}

            {/* Resend button */}
            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="w-full py-3 px-4 bg-white border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isResending ? (
                  'Envoi en cours...'
                ) : resendCooldown > 0 ? (
                  `Renvoyer dans ${resendCooldown}s`
                ) : (
                  'Renvoyer l\'email'
                )}
              </button>

              <button
                onClick={() => router.push('/register/candidate?email=' + email)}
                className="w-full py-3 px-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Changer d'email
              </button>
            </div>

            {/* Manual login */}
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                J'ai déjà vérifié mon email
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Success state */}
        {verified && (
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/candidate/onboarding')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              Compléter mon profil
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
