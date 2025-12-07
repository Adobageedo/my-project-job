'use client';

import Link from 'next/link';
import { X, LogIn, UserPlus } from 'lucide-react';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  loginUrl?: string;
  registerUrl?: string;
}

/**
 * Modal prompt pour inciter l'utilisateur à se connecter
 * Utilisé sur les pages à accès public avec fonctionnalités réservées
 */
export function LoginPrompt({
  isOpen,
  onClose,
  title = 'Connexion requise',
  message = 'Vous devez être connecté pour accéder à cette fonctionnalité.',
  loginUrl = '/login-candidate',
  registerUrl = '/register/candidate',
}: LoginPromptProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={loginUrl}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <LogIn className="h-5 w-5" />
              Se connecter
            </Link>

            <Link
              href={registerUrl}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
            >
              <UserPlus className="h-5 w-5" />
              Créer un compte
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Continuer sans me connecter
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
