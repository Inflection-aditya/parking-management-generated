import express from 'express';
import { IUserAuthenticator } from '../interfaces/user.authenticator.interface';
import { ActionScope, AuthResult } from '../../domain.types/auth.types';
import { CurrentUser } from '../../domain.types/miscellaneous/current.user';
import { verifyAccessToken } from '../utils/jwt.utils';
import { logger } from '../../logger/logger';
import { AuthRequest } from '../middleware/auth.middleware';

/////////////////////////////////////////////////////////////////////////////////

export class CustomUserAuthenticator implements IUserAuthenticator {

    constructor() {
        // Services can be injected here if needed
    }

    public authenticate = async (
        request: express.Request
    ): Promise<AuthResult> => {

        let res: AuthResult = {
            Result        : true,
            Message       : 'Authenticated',
            HttpErrorCode : 200,
        };

        try {
            const publicAccess = request.actionScope === ActionScope.Public;
            const optionalUserAuth = request.optionalUserAuth;
            const privilegedClient = request.currentClient?.IsPrivileged as boolean;

            const authHeader = request.headers['authorization'];
            const token = authHeader && authHeader.toString().split(' ')[1];

            const missingToken = token == null || token === 'null' || token === undefined;

            const allowWithoutToken = publicAccess || optionalUserAuth || privilegedClient;

            if (missingToken) {
                if (allowWithoutToken) {
                    return res;
                }
                res = {
                    Result       : false,
                    Message      : 'Unauthorized user access',
                    HttpErrorCode: 401,
                };
                return res;
            }

            // Verify token using existing JWT utils
            try {
                const decoded = verifyAccessToken(token);

                // Convert JWT payload to CurrentUser format
                const currentUser: CurrentUser = {
                    UserId         : decoded.userId || decoded.sub || '',
                    DisplayName    : decoded.username || decoded.email || '',
                    Phone          : '',
                    Email          : decoded.email || '',
                    UserName       : decoded.username || decoded.email || '',
                    CurrentRoleId  : 0,                                         // Can be extracted from roles if needed
                    CurrentRoleName: decoded.role || undefined,
                    SessionId      : decoded.sub || decoded.userId || ''
                };

                request.currentUser = currentUser;

                // Set user on request for compatibility
                const authReq = request as AuthRequest;
                authReq.user = {
                    userId  : decoded.userId,
                    username: decoded.username,
                    email   : decoded.email,
                    role    : decoded.role
                };

                // Set tenant ID if available
                if ((decoded as any).tenantId) {
                    request.currentUserTenantId = (decoded as any).tenantId;
                }

                res = {
                    Result       : true,
                    Message      : 'Authenticated',
                    HttpErrorCode: 200,
                };

                return res;
            } catch (error: any) {
                res = {
                    Result       : false,
                    Message      : 'Invalid or expired user login session.',
                    HttpErrorCode: 403,
                };
                return res;
            }
        } catch (err: any) {
            logger.error(JSON.stringify(err, null, 2));
            logger.error(err.message);
            res = {
                Result       : false,
                Message      : 'Forbidden user access: ' + err.message,
                HttpErrorCode: 403,
            };
            return res;
        }
    };

    public rotateUserSessionToken = async (refreshToken: string): Promise<string> => {
        // TODO: Implement token rotation
        throw new Error('Token rotation not implemented yet');
    };

    public generateRefreshToken = async (userId: string, sessionId: string, tenantId: string): Promise<string> => {
        // TODO: Implement refresh token generation
        throw new Error('Refresh token generation not implemented yet');
    };

    public generateUserSessionToken = async (user: CurrentUser): Promise<string> => {
        // TODO: Implement session token generation
        throw new Error('Session token generation not implemented yet');
    };

}
