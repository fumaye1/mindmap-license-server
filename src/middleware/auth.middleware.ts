import { Request, Response, NextFunction } from 'express';
import { validateAdminToken } from '../utils/validation.utils';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!validateAdminToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (validateAdminToken(token)) {
      (req as any).isAdmin = true;
    }
  }

  next();
}
