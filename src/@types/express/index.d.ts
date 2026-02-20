import { Request } from 'express';
import { RequestType, ResourceOwnership, ActionScope } from '../../domain.types/auth.types';
import { CurrentUser } from '../../domain.types/miscellaneous/current.user';
import { CurrentClient } from '../../domain.types/miscellaneous/current.client';

declare global {
    namespace Express {
        interface Request {
            // JWT-based authentication properties
            user?: {
                userId: string;
                username?: string;
                email?: string;
                role?: string;
                sub?: string;
                tenantId?: string;
                roles?: string[];
                permissions?: string[];
                [key: string]: any;
            };
            // Auth context properties
            context?: string;
            requestType?: RequestType;
            ownership?: ResourceOwnership;
            actionScope?: ActionScope;
            clientAppAuth?: boolean;
            customAuthorization?: boolean;
            optionalUserAuth?: boolean;
            // Resource properties
            resourceType?: string;
            resourceId?: string | number | null | undefined;
            resourceOwnerUserId?: string;
            currentUserTenantId?: string;
            resourceTenantId?: string | null | undefined;
            // Client app properties
            clientApp?: {
                id: string;
                name: string;
                ownerUserId?: string;
            };
            currentClient?: CurrentClient;
            currentUser?: CurrentUser;
            // Legacy properties
            allowAnonymous?: boolean;
            publicUrl?: boolean;
        }
    }
}
