import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Rate Limit Guard
 * Implements in-memory rate limiting with IP and user-based tracking
 */

// =====================================================
// RATE LIMIT CONFIGURATION
// =====================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Decorator to apply rate limiting to a controller or handler
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Common rate limit presets
 */
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  },
  // Registration limit
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.',
  },
  // Password reset limit
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer plus tard.',
  },
  // Standard API limit
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Trop de requêtes. Veuillez patienter.',
  },
  // Strict limit for sensitive operations
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Limite de requêtes atteinte. Veuillez patienter.',
  },
  // File upload limit
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Limite d\'upload atteinte. Veuillez réessayer plus tard.',
  },
  // AI parsing limit (expensive operations)
  aiParsing: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Limite de parsing IA atteinte. Veuillez réessayer plus tard.',
  },
};

// =====================================================
// IN-MEMORY STORE
// =====================================================

interface RateLimitRecord {
  count: number;
  firstRequest: number;
  blocked: boolean;
}

class RateLimitStore {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    this.store.set(key, record);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    for (const [key, record] of this.store.entries()) {
      if (now - record.firstRequest > maxAge) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton store instance
const rateLimitStore = new RateLimitStore();

// =====================================================
// RATE LIMIT GUARD
// =====================================================

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no rate limit config, allow the request
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.generateKey(request, config);
    const now = Date.now();

    let record = rateLimitStore.get(key);

    // Initialize new record
    if (!record) {
      record = {
        count: 0,
        firstRequest: now,
        blocked: false,
      };
    }

    // Reset if window expired
    if (now - record.firstRequest > config.windowMs) {
      record = {
        count: 0,
        firstRequest: now,
        blocked: false,
      };
    }

    // Check if blocked
    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil(
        (record.firstRequest + config.windowMs - now) / 1000,
      );

      const response = context.switchToHttp().getResponse();
      response.setHeader('Retry-After', retryAfter);
      response.setHeader('X-RateLimit-Limit', config.maxRequests);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader(
        'X-RateLimit-Reset',
        Math.ceil((record.firstRequest + config.windowMs) / 1000),
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: config.message || 'Trop de requêtes. Veuillez patienter.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, config.maxRequests - record.count),
    );
    response.setHeader(
      'X-RateLimit-Reset',
      Math.ceil((record.firstRequest + config.windowMs) / 1000),
    );

    return true;
  }

  private generateKey(request: Request, config: RateLimitConfig): string {
    // Use custom key generator if provided
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    // Default: combine IP + route + user ID (if authenticated)
    const ip = this.getClientIp(request);
    const route = `${request.method}:${request.route?.path || request.path}`;
    const userId = (request as any).user?.sub || 'anonymous';

    return `${ip}:${route}:${userId}`;
  }

  private getClientIp(request: Request): string {
    // Check various headers for the real IP (behind proxies)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}

// =====================================================
// CAPTCHA VERIFICATION SERVICE
// =====================================================

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  score?: number; // For reCAPTCHA v3
}

export async function verifyCaptcha(
  token: string,
  provider: 'hcaptcha' | 'recaptcha' = 'hcaptcha',
  remoteIp?: string,
): Promise<CaptchaVerificationResult> {
  const secretKey =
    provider === 'hcaptcha'
      ? process.env.HCAPTCHA_SECRET_KEY
      : process.env.RECAPTCHA_SECRET_KEY;

  // Skip verification in development if no key configured
  if (!secretKey) {
    console.warn(`[Captcha] No ${provider} secret key configured, skipping verification`);
    return { success: true };
  }

  const verifyUrl =
    provider === 'hcaptcha'
      ? 'https://hcaptcha.com/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify';

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        score: data.score, // reCAPTCHA v3 only
      };
    }

    return {
      success: false,
      error: data['error-codes']?.join(', ') || 'Verification failed',
    };
  } catch (error) {
    console.error('[Captcha] Verification error:', error);
    return {
      success: false,
      error: 'Captcha verification failed',
    };
  }
}
