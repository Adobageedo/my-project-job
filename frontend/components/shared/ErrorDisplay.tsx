import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  error?: Error | string;
  message?: string;
  fullScreen?: boolean;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export default function ErrorDisplay({ 
  error, 
  message, 
  fullScreen = false,
  onRetry,
  showHomeButton = true,
}: ErrorDisplayProps) {
  const errorMessage = message || (typeof error === 'string' ? error : error?.message) || 'Une erreur est survenue';

  const content = (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{errorMessage}</p>
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        )}
        {showHomeButton && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
      {content}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-800 font-medium">Erreur</p>
        <p className="text-red-700 text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ 
  title, 
  description, 
  action,
  icon: Icon = AlertTriangle,
}: { 
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
