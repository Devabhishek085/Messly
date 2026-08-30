import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Missing or invalid authorization token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'messly_secret_jwt_key_2026_kiet_hostel';

  try {
    const decoded = jwt.verify(token, secret) as { id: string; username: string; role: string };
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized. Token expired or invalid.' });
    return;
  }
};
