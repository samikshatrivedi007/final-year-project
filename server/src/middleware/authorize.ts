import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: `Access forbidden. Requires: ${roles.join(' or ')}` });
            return;
        }
        next();
    };
};
