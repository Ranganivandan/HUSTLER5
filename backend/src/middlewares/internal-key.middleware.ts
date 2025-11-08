import type { Request, Response, NextFunction } from 'express';

export function requireInternalKey(req: Request, res: Response, next: NextFunction) {
  const header = req.get('x-internal-api-key');
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || header !== expected) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
