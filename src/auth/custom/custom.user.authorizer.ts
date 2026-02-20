import express from 'express';
import { logger } from '../../logger/logger';
import { IUserAuthorizer } from '../interfaces/user.authorizer.interface';
import { PermissionHandler } from './permission.handler';
import { ActionScope } from '../../domain.types/auth.types';

//////////////////////////////////////////////////////////////

export class CustomUserAuthorizer implements IUserAuthorizer {

    constructor() {

    }

    public authorize = async (request: express.Request, response: express.Response | null): Promise<boolean> => {
        try {

            const context = request.context;
            if (context == null || context === 'undefined') {
                return false;
            }

            // Temp solution - Needs to be refined
            if (request.currentClient?.IsPrivileged) {
                return true;
            }

            const publicAccess = request.actionScope === ActionScope.Public;
            const optionalUserAuth = request.optionalUserAuth;

            const currentUser = request.currentUser ?? null;
            if (!currentUser) {
                //If the user is not authenticated, then check if the resource access is public
                if (publicAccess || optionalUserAuth) {
                    // To check whether a particular resource is available for public access, e.g. a profile image download
                    return true;
                }
                // If the resource is not public, then the user must be authenticated
                return false;
            }

            // First check role-based permissions (for admin/system users)
            const hasRolePermission = await PermissionHandler.checkRoleBasedPermissions(request);
            if (hasRolePermission) {
                return true;
            }

            // Then check fine-grained permissions (ownership, tenant scope, etc.)
            const hasFineGrainedPermission = await PermissionHandler.checkFineGrained(request);
            return hasFineGrainedPermission;

        } catch (error: any) {
            logger.error(error.message);
        }
        return false;
    };

}
