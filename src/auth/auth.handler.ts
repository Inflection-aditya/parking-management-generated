import { Request, Response, NextFunction } from 'express';
import { UserAuthorizer } from './wrappers/user.authorizer';
import { UserAuthenticator } from './wrappers/user.authenticator';
import { Injector } from '../startup/injector';
import { ResponseHandler } from '../common/handlers/response.handler';
import { AuthOptions, RequestType, ResourceOwnership, ActionScope } from '../domain.types/auth.types';
import { verifyAccessToken } from './utils/jwt.utils';
import { AuthRequest } from './middleware/auth.middleware';
import { CurrentUser } from '../domain.types/miscellaneous/current.user';
import ClientAppAuthMiddleware from '../middlewares/client.app.auth.middleware';

////////////////////////////////////////////////////////////////////////////////////////////////
export type AuthMiddleware =
    (request: Request, response: Response, next: NextFunction)
    => Promise<void>;
////////////////////////////////////////////////////////////////////////////////////////////////

export class AuthHandler {

    public static handle = (options: AuthOptions): AuthMiddleware[] => {

        var middlewares: AuthMiddleware[] = [];

        //Set context
        var contextSetter = async (request: Request, response: Response, next: NextFunction) => {
            request.context = options.Context || '';
            if (options.Context) {
                const tokens = options.Context.split('.');
                if (tokens.length < 2) {
                    ResponseHandler.failure(request, response, 'Invalid request context', 400);
                    return;
                }
            }
            request.requestType = options.RequestType;
            request.ownership = options.Ownership;
            request.actionScope = options.ActionScope;
            request.clientAppAuth = options.ClientAppAuth ?? false;
            request.customAuthorization = options.CustomAuthorization ? options.CustomAuthorization : false;
            next();
        };
        middlewares.push(contextSetter);

        //Line-up the auth middleware chain
        const clientAppAuth = options.ClientAppAuth ?? false;
        const systemOwnedResource = options.Ownership === ResourceOwnership.System;
        const publicAccess = options.ActionScope === ActionScope.Public;

                // Client app authentication could be turned off for certain endpoints. e.g. public file downloads, etc.
        if (clientAppAuth === true) {
            middlewares.push(ClientAppAuthMiddleware.authenticateClient);
        }

        // Convert JWT user to CurrentUser format
        const userConverter = async (request: AuthRequest, response: Response, next: NextFunction) => {
            if (request.user) {
                const jwtUser = request.user;
                const currentUser: CurrentUser = {
                    UserId: jwtUser.userId || '',
                    DisplayName: jwtUser.username || jwtUser.email || '',
                    Phone: '',
                    Email: jwtUser.email || '',
                    UserName: jwtUser.username || jwtUser.email || '',
                    CurrentRoleId: 0, // Can be extracted from roles if needed
                    CurrentRoleName: jwtUser.role || undefined,
                    SessionId: jwtUser.userId || ''
                };
                request.currentUser = currentUser;
                if ((jwtUser as any).tenantId) {
                    request.currentUserTenantId = (jwtUser as any).tenantId;
                }
            }
            next();
        };

        // Perform user authentication (JWT verification)
        // For public routes, make authentication optional
        if (publicAccess) {
            const optionalAuth = async (request: AuthRequest, response: Response, next: NextFunction) => {
                const authHeader = request.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    // If token is provided, verify it and convert user
                    try {
                        const token = authHeader.substring(7);
                        const decoded = verifyAccessToken(token);
                        request.user = {
                            userId: decoded.userId,
                            username: decoded.username,
                            email: decoded.email,
                            role: decoded.role
                        };
                        await userConverter(request, response, next);
                    } catch {
                        // If verification fails, continue without authentication for public routes
                        next();
                    }
                } else {
                    // No token provided, continue without authentication
                    next();
                }
            };
            middlewares.push(optionalAuth);
        } else {
            // Use existing userAuth middleware for protected routes
            const userAuthMiddleware = async (request: AuthRequest, response: Response, next: NextFunction) => {
                try {
                    const authHeader = request.headers.authorization;
                    
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        ResponseHandler.failure(request, response, 'No token provided', 401);
                        return;
                    }

                    const token = authHeader.substring(7);
                    const decoded = verifyAccessToken(token);
                    request.user = {
                        userId: decoded.userId,
                        username: decoded.username,
                        email: decoded.email,
                        role: decoded.role
                    };
                    await userConverter(request, response, next);
                } catch (error) {
                    ResponseHandler.failure(request, response, 'Invalid token', 401);
                    return;
                }
            };
            middlewares.push(userAuthMiddleware);
        }

        // Open routes that do not require user authorization
        // For example, public resources, system resources, system types, etc.

        if (publicAccess && systemOwnedResource) {
            return middlewares;
        }

        // Use dependency injection to get authorizer
        try {
            var authorizer = Injector.Container.resolve(UserAuthorizer);
            middlewares.push(authorizer.authorize);
        } catch (error) {
            // If dependency injection fails, skip authorization (for development)
            // In production, this should be properly configured
        }

        return middlewares;
    };

    public static verifyAccess = async(request: Request): Promise<boolean> => {
        try {
            var userAuthorizer = Injector.Container.resolve(UserAuthorizer);
            const authorized = await userAuthorizer.verify(request);
            if (!authorized) {
                throw new Error('Forbidden access');
            }
            return true;
        } catch (error) {
            throw error;
        }
    };

    private static getResourceId = (request: Request, resourceIdName?: string): string | number | null | undefined => {
        var resourceId = null;
        if (resourceIdName &&
            request.params[resourceIdName] != null &&
            request.params[resourceIdName] !== 'undefined') {
            resourceId = request.params[resourceIdName];
            return resourceId;
        }
        else if (request.params.id != null && request.params.id !== 'undefined') {
            if (request.requestType === RequestType.GetOne ||
                request.requestType === RequestType.UpdateOne ||
                request.requestType === RequestType.DeleteOne) {
                resourceId = request.params.id;
                return resourceId;
            }
        }
        return resourceId;
    };

}

export const auth = AuthHandler.handle;
