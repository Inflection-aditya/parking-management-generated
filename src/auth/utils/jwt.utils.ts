import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../domain.types/auth.types';

const config = {
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
};

export const generateAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as any
    });
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as any
    });
};

export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};

export const generateTokens = (payload: Omit<JwtPayload, 'iat' | 'exp'>) => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    return {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessExpiresIn
    };
};
