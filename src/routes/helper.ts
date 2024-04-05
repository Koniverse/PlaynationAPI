import { Request, Response, NextFunction } from 'express';

export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.address) {
    next();
  } else {
    res.status(401).send('Unauthorized: Please login first');
  }
}
