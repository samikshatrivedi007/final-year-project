import jwt from 'jsonwebtoken';

export const generateToken = (payload: { id: string; role: string; username: string }): string => {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};
