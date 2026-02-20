import { Request, Response, NextFunction } from 'express';

export const context = (contextName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Simple context handler for JWT-based authentication
        // Set basic context information
        req.context = contextName;
        req.resourceType = 'api';
        req.allowAnonymous = false;
        req.publicUrl = false;
        
        next();
    };
};
