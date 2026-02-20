import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../../common/handlers/response.handler';
import { RolePermissions } from '../../master.data/role.permissions';
import { AuthRequest } from './auth.middleware';

/**
 * Checks if a user has a specific permission based on their role
 */
export const hasPermission = (requiredPermission: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userRole = req.user?.role;

            if (!userRole) {
                ResponseHandler.failure(req, res, 'User role not found', 403);
                return;
            }

            // Find the role's permissions
            const roleConfig = RolePermissions.find(rp => rp.Role === userRole);

            if (!roleConfig) {
                ResponseHandler.failure(req, res, 'Invalid role configuration', 403);
                return;
            }

            // Check if the role has the required permission
            if (!roleConfig.Permissions.includes(requiredPermission)) {
                ResponseHandler.failure(
                    req,
                    res,
                    `Access denied. Required permission: ${requiredPermission}`,
                    403
                );
                return;
            }

            // User has permission, proceed
            next();
        } catch (error) {
            ResponseHandler.failure(req, res, 'Authorization error', 500);
            return;
        }
    };
};

/**
 * Checks if a user has any of the specified permissions
 */
export const hasAnyPermission = (requiredPermissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userRole = req.user?.role;

            if (!userRole) {
                ResponseHandler.failure(req, res, 'User role not found', 403);
                return;
            }

            // Find the role's permissions
            const roleConfig = RolePermissions.find(rp => rp.Role === userRole);

            if (!roleConfig) {
                ResponseHandler.failure(req, res, 'Invalid role configuration', 403);
                return;
            }

            // Check if the role has any of the required permissions
            const hasAny = requiredPermissions.some(permission =>
                roleConfig.Permissions.includes(permission)
            );

            if (!hasAny) {
                ResponseHandler.failure(
                    req,
                    res,
                    `Access denied. Required one of: ${requiredPermissions.join(', ')}`,
                    403
                );
                return;
            }

            // User has at least one permission, proceed
            next();
        } catch (error) {
            ResponseHandler.failure(req, res, 'Authorization error', 500);
            return;
        }
    };
};

/**
 * Checks if a user has all of the specified permissions
 */
export const hasAllPermissions = (requiredPermissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userRole = req.user?.role;

            if (!userRole) {
                ResponseHandler.failure(req, res, 'User role not found', 403);
                return;
            }

            // Find the role's permissions
            const roleConfig = RolePermissions.find(rp => rp.Role === userRole);

            if (!roleConfig) {
                ResponseHandler.failure(req, res, 'Invalid role configuration', 403);
                return;
            }

            // Check if the role has all of the required permissions
            const hasAll = requiredPermissions.every(permission =>
                roleConfig.Permissions.includes(permission)
            );

            if (!hasAll) {
                ResponseHandler.failure(
                    req,
                    res,
                    `Access denied. Required all of: ${requiredPermissions.join(', ')}`,
                    403
                );
                return;
            }

            // User has all permissions, proceed
            next();
        } catch (error) {
            ResponseHandler.failure(req, res, 'Authorization error', 500);
            return;
        }
    };
};

/**
 * Checks if a user has a specific role
 */
export const hasRole = (allowedRoles: string | string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userRole = req.user?.role;

            if (!userRole) {
                ResponseHandler.failure(req, res, 'User role not found', 403);
                return;
            }

            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!rolesArray.includes(userRole)) {
                ResponseHandler.failure(
                    req,
                    res,
                    `Access denied. Required role: ${rolesArray.join(' or ')}`,
                    403
                );
                return;
            }

            // User has the required role, proceed
            next();
        } catch (error) {
            ResponseHandler.failure(req, res, 'Authorization error', 500);
            return;
        }
    };
};

/**
 * Helper function to get all permissions for a role
 */
export const getRolePermissions = (roleName: string): string[] => {
    const roleConfig = RolePermissions.find(rp => rp.Role === roleName);
    return roleConfig ? roleConfig.Permissions : [];
};

/**
 * Helper function to check if a role has a specific permission
 */
export const checkRolePermission = (roleName: string, permission: string): boolean => {
    const permissions = getRolePermissions(roleName);
    return permissions.includes(permission);
};

/**
 * Middleware to ensure user can only access their own resources
 * unless they have System Admin or System User role
 */
export const canAccessUserResource = () => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const currentUserId = req.user?.userId;
            const targetUserId = req.params.id || req.body.userId;
            const userRole = req.user?.role;

            if (!currentUserId) {
                ResponseHandler.failure(req, res, 'User not authenticated', 401);
                return;
            }

            // System Admin can access all user resources
            if (userRole === 'System Admin') {
                next();
                return;
            }

            // System User can view user resources
            if (userRole === 'System User' && req.method === 'GET') {
                next();
                return;
            }

            // Normal users can only access their own resources
            if (currentUserId === targetUserId) {
                next();
                return;
            }

            ResponseHandler.failure(
                req,
                res,
                'Access denied. You can only access your own resources.',
                403
            );
            return;
        } catch (error) {
            ResponseHandler.failure(req, res, 'Authorization error', 500);
            return;
        }
    };
};

