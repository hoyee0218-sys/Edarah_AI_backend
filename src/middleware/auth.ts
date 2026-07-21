import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../utils/helpers.js';
import { AppError } from '../utils/errors.js';

export type AuthRequest = Request & {
  user?: JwtPayload;
};

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
