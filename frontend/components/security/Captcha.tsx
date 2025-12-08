'use client';

import { useRef, useEffect, useCallback } from 'react';
import Script from 'next/script';

// =====================================================
// CAPTCHA COMPONENT
// Supports both hCaptcha (default) and reCAPTCHA
// =====================================================

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: HTMLElement, options: object) => string;
      reset: (widgetId: string) => void;
      execute: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
    grecaptcha?: {
      render: (container: HTMLElement, options: object) => string;
      reset: (widgetId: string) => void;
      execute: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
    onCaptchaLoad?: () => void;
  }
}

export type CaptchaProvider = 'hcaptcha' | 'recaptcha';

interface CaptchaProps {
  siteKey: string;
  provider?: CaptchaProvider;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

// Configuration captcha
export const CAPTCHA_CONFIG = {
  // Activer/désactiver le captcha globalement
  enabled: process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === 'true',
  // Provider par défaut
  provider: (process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER || 'hcaptcha') as CaptchaProvider,
};

// Default site keys for development (test keys that always pass)
export const CAPTCHA_SITE_KEYS = {
  hcaptcha: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001', // Test key
  recaptcha: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Test key
};

export default function Captcha({
  siteKey,
  provider = 'hcaptcha',
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  className = '',
}: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const handleVerify = useCallback(
    (token: string) => {
      onVerify(token);
    },
    [onVerify]
  );

  const handleExpire = useCallback(() => {
    onExpire?.();
  }, [onExpire]);

  const handleError = useCallback(
    (error: string) => {
      console.error('Captcha error:', error);
      onError?.(error);
    },
    [onError]
  );

  const renderCaptcha = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current) return;

    const captchaLib = provider === 'hcaptcha' ? window.hcaptcha : window.grecaptcha;
    if (!captchaLib) return;

    try {
      widgetIdRef.current = captchaLib.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: handleVerify,
        'expired-callback': handleExpire,
        'error-callback': handleError,
      });
    } catch (error) {
      console.error('Failed to render captcha:', error);
    }
  }, [siteKey, provider, theme, size, handleVerify, handleExpire, handleError]);

  useEffect(() => {
    // Set up callback for when script loads
    window.onCaptchaLoad = () => {
      scriptLoadedRef.current = true;
      renderCaptcha();
    };

    // If script already loaded, render immediately
    const captchaLib = provider === 'hcaptcha' ? window.hcaptcha : window.grecaptcha;
    if (captchaLib) {
      scriptLoadedRef.current = true;
      renderCaptcha();
    }

    return () => {
      // Cleanup
      window.onCaptchaLoad = undefined;
    };
  }, [provider, renderCaptcha]);

  // Reset function exposed via ref (for parent components)
  const reset = useCallback(() => {
    if (!widgetIdRef.current) return;

    const captchaLib = provider === 'hcaptcha' ? window.hcaptcha : window.grecaptcha;
    if (captchaLib) {
      captchaLib.reset(widgetIdRef.current);
    }
  }, [provider]);

  // Get script URL based on provider
  const scriptUrl =
    provider === 'hcaptcha'
      ? 'https://js.hcaptcha.com/1/api.js?onload=onCaptchaLoad&render=explicit'
      : 'https://www.google.com/recaptcha/api.js?onload=onCaptchaLoad&render=explicit';

  return (
    <>
      <Script src={scriptUrl} strategy="lazyOnload" />
      <div ref={containerRef} className={className} data-reset={reset} />
    </>
  );
}

// =====================================================
// INVISIBLE CAPTCHA HOOK
// For forms that need invisible captcha execution
// =====================================================

interface UseInvisibleCaptchaOptions {
  siteKey: string;
  provider?: CaptchaProvider;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

export function useInvisibleCaptcha({
  siteKey,
  provider = 'hcaptcha',
  onVerify,
  onError,
}: UseInvisibleCaptchaOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);

  const execute = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const captchaLib = provider === 'hcaptcha' ? window.hcaptcha : window.grecaptcha;

      if (!captchaLib || !widgetIdRef.current) {
        reject(new Error('Captcha not initialized'));
        return;
      }

      resolveRef.current = (token: string) => {
        onVerify(token);
        resolve(token);
      };

      try {
        captchaLib.execute(widgetIdRef.current);
      } catch (error) {
        reject(error);
      }
    });
  }, [provider, onVerify]);

  const reset = useCallback(() => {
    const captchaLib = provider === 'hcaptcha' ? window.hcaptcha : window.grecaptcha;
    if (captchaLib && widgetIdRef.current) {
      captchaLib.reset(widgetIdRef.current);
    }
  }, [provider]);

  const init = useCallback(
    (container: HTMLDivElement) => {
      containerRef.current = container;
      const captchaLib = provider === 'hcaptcha' ? window.hcaptcha : window.grecaptcha;

      if (!captchaLib || widgetIdRef.current) return;

      try {
        widgetIdRef.current = captchaLib.render(container, {
          sitekey: siteKey,
          size: 'invisible',
          callback: (token: string) => {
            if (resolveRef.current) {
              resolveRef.current(token);
              resolveRef.current = null;
            }
          },
          'error-callback': (error: string) => {
            onError?.(error);
          },
        });
      } catch (error) {
        console.error('Failed to init invisible captcha:', error);
      }
    },
    [siteKey, provider, onError]
  );

  return { execute, reset, init };
}
