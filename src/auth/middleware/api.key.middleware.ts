import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../../database/typeorm/services/api.key.service';
import { ResponseHandler } from '../../common/handlers/response.handler';

export interface ApiKeyRequest extends Request {
    clientApp?: {
        id: string;
        name: string;
        ownerUserId: string;
    };
}

export const apiKeyAuth = async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const apiKey = req.headers['x-api-key'] as string;
        const apiSecret = req.headers['x-api-secret'] as string;

        if (!apiKey || !apiSecret) {
            ResponseHandler.failure(req, res, 'API key and secret required', 401);
            return;
        }

        const apiKeyService = new ApiKeyService();
        const isValid = await apiKeyService.validateApiKey(apiKey, apiSecret);

        if (!isValid) {
            ResponseHandler.failure(req, res, 'Invalid API key or secret', 401);
            return;
        }

        // Get API key details for context
        const apiKeyDetails = await apiKeyService.getApiKeyByKey(apiKey);
        if (apiKeyDetails) {
            // You might want to fetch client app details here
            req.clientApp = {
                id: apiKeyDetails.clientAppId,
                name: 'Client App', // You might want to fetch this from ClientAppService
                ownerUserId: 'owner-id' // You might want to fetch this from ClientAppService
            };
        }

        next();
    } catch (error) {
        ResponseHandler.failure(req, res, 'API key authentication error', 500);
        return;
    }
};
