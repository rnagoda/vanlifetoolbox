import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Supabase JWT payload structure
interface SupabaseJwtPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string; // User ID
  email?: string;
  phone?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: Record<string, unknown>;
  role: string;
  aal: string;
  amr: Array<{ method: string; timestamp: number }>;
  session_id: string;
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    'SUPABASE_JWT_SECRET not set. Authentication will not work. ' +
      'Set this environment variable from your Supabase project settings.'
  );
}

/**
 * Middleware to authenticate requests using Supabase JWT tokens.
 * Sets req.user with { id, email } if token is valid.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authorization header with Bearer token is required',
      },
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!JWT_SECRET) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Server authentication not configured',
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as SupabaseJwtPayload;

    // Verify the token is from our Supabase project
    const expectedIssuer = `${process.env.SUPABASE_URL}/auth/v1`;
    if (decoded.iss !== expectedIssuer) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid token issuer',
        },
      });
      return;
    }

    // Set user info on request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired. Please refresh your session.',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid authentication token',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
    });
  }
}

/**
 * Optional authentication middleware.
 * Sets req.user if a valid token is provided, but doesn't require it.
 * Useful for endpoints that behave differently for authenticated users.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ') || !JWT_SECRET) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as SupabaseJwtPayload;

    const expectedIssuer = `${process.env.SUPABASE_URL}/auth/v1`;
    if (decoded.iss === expectedIssuer) {
      req.user = {
        id: decoded.sub,
        email: decoded.email,
      };
    }
  } catch {
    // Ignore errors for optional auth - just proceed without user
  }

  next();
}
