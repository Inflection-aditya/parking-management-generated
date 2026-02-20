import express from 'express';
import { Injector } from '../../startup/injector';
import { ActionScope, RequestType, ResourceOwnership } from "../../domain.types/auth.types";
import { uuid } from '../../domain.types/miscellaneous/system.types';
import { CurrentUser } from "../../domain.types/miscellaneous/current.user";
import { logger } from '../../logger/logger';
import { AuthRequest } from '../middleware/auth.middleware';

////////////////////////////////////////////////////////////////////////////////////////

export class PermissionHandler {

    public static checkRoleBasedPermissions = async (request: express.Request): Promise<boolean> => {
        const currentUser = request.currentUser;
        if (!currentUser) {
            return false;
        }

        const context = request.context;
        if (!context) {
            return false;
        }

        // Get JWT user data from token
        const authReq = request as AuthRequest;
        const jwtUser = authReq.user;

        if (!jwtUser) {
            return false;
        }

        const userId = currentUser.UserId;
        const userRole = jwtUser.role;

        // Check if user has the permission in their JWT token permissions array
        if ((jwtUser as any).permissions && Array.isArray((jwtUser as any).permissions)) {
            if ((jwtUser as any).permissions.includes(context)) {
                logger.debug(`User ${userId} has permission ${context} from JWT token`);
                return true;
            }
        }

        // Check for system admin roles - these have access to all permissions
        const systemAdminRoles = ['SystemAdmin', 'Admin', 'SuperAdmin', 'System admin'];
        if (userRole && systemAdminRoles.includes(userRole)) {
            logger.debug(`User ${userId} has admin role ${userRole}, granting access to ${context}`);
            return true;
        }

        return false;
    };

    public static checkConsent = async (
        resourceOwnerUserId: uuid,
        requesterUserId: uuid,
        context: string
    ) => {
        // If user is accessing their own resource, no consent needed
        if (resourceOwnerUserId === requesterUserId) {
            return true;
        }

        // const consentService = Injector.Container.resolve(ConsentService);
        // const consents = await consentService.getActiveConsents(
        //     resourceOwnerUserId,
        //     requesterUserId,
        //     context
        // );
        // if (consents == null || consents.length === 0) {
        //     return false;
        // }
        // return true;

        // For now, return false (no consent) - implement ConsentService later
        return false;
    };

    // Check permissions by ownership, action scope and consent
    public static checkFineGrained = async (request: express.Request): Promise<boolean> => {

        const currentUser = request.currentUser ?? null;
        if (!currentUser) {
            return false;
        }

        // Get role name from CurrentUser (which is set from JWT token)
        const currentUserRole = currentUser.CurrentRoleName;

        // Get JWT user data for additional role checks
        const authReq = request as AuthRequest;
        const jwtUser = authReq.user;
        const userRole = jwtUser?.role;

        // 2. SuperAdmin (System Admin) has access to all resources
        const systemAdminRoles = ['SystemAdmin', 'Admin', 'SuperAdmin', 'System admin'];
        if (currentUserRole && systemAdminRoles.includes(currentUserRole)) {
            return true;
        }
        // Also check JWT role
        if (userRole && systemAdminRoles.includes(userRole)) {
            return true;
        }

        // 3. SystemUser
        // System user access has already been checked for role based permissions
        if (currentUserRole === 'SystemUser' || currentUserRole === 'System user') {
            const msg = `System User access has already been checked for role based permissions`;
            logger.info(msg);
            return true;
        }
        if (userRole === 'SystemUser' || userRole === 'System user') {
            const msg = `System User access has already been checked for role based permissions`;
            logger.info(msg);
            return true;
        }

        // TenantAdmin check
        if (currentUserRole === 'TenantAdmin' || currentUserRole === 'Tenant admin') {
            // Tenant Admin has access to all resources in the tenant scope
            const userTenantId = (jwtUser as any)?.tenantId || request.currentUserTenantId;
            if (userTenantId && request.resourceTenantId === userTenantId
              && request.actionScope === ActionScope.Tenant) {
                return true;
            }
        }
        if (userRole === 'TenantAdmin' || userRole === 'Tenant admin') {
            const userTenantId = (jwtUser as any)?.tenantId || request.currentUserTenantId;
            if (userTenantId && request.resourceTenantId === userTenantId
              && request.actionScope === ActionScope.Tenant) {
                return true;
            }
        }

        return await this.checkByRequestType(request, currentUser);
    };

    private static checkScopeWithOwnership = (
        ownership: ResourceOwnership,
        actionScope: ActionScope,
        isOwner: boolean,
        areTenantsSame: boolean,
        hasConsent: boolean
    ): boolean => {
        //visible to the individual owner only
        if (ownership === ResourceOwnership.Owner) {
            if (actionScope === ActionScope.Owner) {
                return isOwner;
            }
            if (actionScope === ActionScope.Tenant) {
                return areTenantsSame && hasConsent;
            }
            if (actionScope === ActionScope.System) {
                return hasConsent;
            }
            return false;
        } else if (ownership === ResourceOwnership.Tenant) {
            return areTenantsSame;
        } else if (ownership === ResourceOwnership.System) {
            return true;
        }
        return false;
    };

    private static checkByRequestType = async (
        request: express.Request,
        currentUser: CurrentUser) => {

        const requestType         = request.requestType;
        const ownership           = request.ownership;
        const actionScope         = request.actionScope;

        // For create operations, if resourceOwnerUserId is not set, assume user is creating for themselves
        // For other operations, check if user is the owner
        let isOwner = false;
        if (requestType === RequestType.CreateOne || requestType === RequestType.CreateMany) {
            // For create operations, user is considered owner if:
            // 1. resourceOwnerUserId is not set (defaults to current user)
            // 2. resourceOwnerUserId matches current user
            isOwner = !request.resourceOwnerUserId || request.resourceOwnerUserId === currentUser.UserId;
        } else {
            isOwner = request.resourceOwnerUserId === currentUser.UserId;
        }

        // Get tenant ID from JWT token or from request
        const authReq = request as AuthRequest;
        const jwtUser = authReq.user;
        const userTenantId = (jwtUser as any)?.tenantId || request.currentUserTenantId;
        // For create operations, if resourceTenantId is not set, assume it will be the user's tenant
        // For other operations, tenants must match
        const areTenantsSame = request.resourceTenantId === userTenantId ||
            ((requestType === RequestType.CreateOne || requestType === RequestType.CreateMany) &&
             !request.resourceTenantId && userTenantId);
        const hasConsent          = await this.hasConsent(request);
        const customAuthorization = request.customAuthorization;

        if (request.optionalUserAuth) {
            // The resources may or may not require user authentication
            // Will be checked specific to the resource visibility...
            // Some resources of a given type may be publicly visible and some may not be
            // For example, File resource - a user profile image file may be publicly visible, but the user document files may not be
            return true;
        }

        //Check if it is single resource request...
        if (
            requestType === RequestType.CreateOne  ||
            requestType === RequestType.GetOne     ||
            requestType === RequestType.UpdateOne  ||
            requestType === RequestType.DeleteOne  ||
            requestType === RequestType.CreateMany ||
            requestType === RequestType.GetMany    ||
            requestType === RequestType.UpdateMany ||
            requestType === RequestType.DeleteMany
        ) {
            return this.checkScopeWithOwnership(ownership, actionScope, isOwner, areTenantsSame, hasConsent);
        }
        if (requestType === RequestType.Search) {
            // Search -> Resources to be filtered according to the ownership and action scope
            // inside the filter settings in controllers
            return true;
        }

        return customAuthorization;
    };

    private static hasConsent = async (request: express.Request): Promise<boolean> => {
        const resourceOwnerUserId = request.resourceOwnerUserId;
        const currentUserId = request.currentUser?.UserId;

        // For create operations, if resourceOwnerUserId is not set, assume user is creating for themselves
        // In this case, consent is automatically granted
        if (!resourceOwnerUserId &&
            (request.requestType === RequestType.CreateOne || request.requestType === RequestType.CreateMany)) {
            return true; // User is creating their own resource
        }

        // If resourceOwnerUserId is not set for other operations, deny access
        if (!resourceOwnerUserId || !currentUserId) {
            return false;
        }

        return await this.checkConsent(
            resourceOwnerUserId,
            currentUserId,
            request.context);
    };

}
