import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { JwtPayload } from '../../domain.types/auth.types';
import { ResponseHandler } from '../../common/handlers/response.handler';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username?: string;
        email?: string;
        role?: string;
    };
}

export const userAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            ResponseHandler.failure(req, res, 'No token provided', 401);
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        try {
            const decoded = verifyAccessToken(token);
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role
            };
            next();
        } catch (error) {
            ResponseHandler.failure(req, res, 'Invalid token', 401);
            return;
        }
    } catch (error) {
        ResponseHandler.failure(req, res, 'Authentication error', 500);
        return;
    }
};
