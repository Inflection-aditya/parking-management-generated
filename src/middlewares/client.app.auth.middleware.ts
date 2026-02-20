import { Request, Response, NextFunction } from 'express';
import { apiKeyAuth, ApiKeyRequest } from '../auth/middleware/api.key.middleware';
import { CurrentClient } from '../domain.types/miscellaneous/current.client';

///////////////////////////////////////////////////////////////////////////////////

class ClientAppAuthMiddleware {
    
    public static authenticateClient = async (
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            // Use the existing apiKeyAuth middleware
            const apiKeyReq = request as ApiKeyRequest;
            await apiKeyAuth(apiKeyReq, response, () => {
                // Convert clientApp to CurrentClient format
                if (apiKeyReq.clientApp) {
                    const currentClient: CurrentClient = {
                        ClientCode: apiKeyReq.clientApp.id || '',
                        ClientName: apiKeyReq.clientApp.name || '',
                        IsPrivileged: false // Can be set based on client app configuration
                    };
                    request.currentClient = currentClient;
                }
                next();
            });
        } catch (error) {
            next(error);
        }
    };
}

export default ClientAppAuthMiddleware;
