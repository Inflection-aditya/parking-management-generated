import { uuid } from './miscellaneous/system.types';
import { BaseSearchFilters } from './miscellaneous/base.search.types';

// Common types
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

// Authentication types
export interface LoginRequest {
    username?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    password: string;
}



export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ResetPasswordRequest {
    email: string;
}

export interface ResetPasswordConfirmRequest {
    token: string;
    newPassword: string;
}

// OTP types
export interface OtpRequest {
    username?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    purpose?: 'login' | 'verification' | 'password_reset';
}

export interface OtpVerifyRequest {
    username?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    code: string;
    purpose?: 'login' | 'verification' | 'password_reset';
}

// API Key types (auth-related)
export interface ApiKey {
    id: string;
    name: string;
    description?: string;
    key: string;
    secretHash: string;
    clientAppId: string;
    isActive: boolean;
    validTill?: Date;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiKeyCreateInput {
    name: string;
    description?: string;
    clientAppId: string;
    validTill?: Date;
}

export interface ApiKeyCreateResponse {
    apiKey: ApiKey;
    secret: string; // Only returned once during creation
}

export interface ApiKeyUpdateInput {
    name?: string;
    description?: string;
    isActive?: boolean;
    validTill?: Date;
}

export interface ApiKeySearchFilters extends BaseSearchFilters {
    name?: string;
    clientAppId?: string;
    isActive?: boolean;
}

// Type aliases for compatibility
export type IApiKey = ApiKey;

// Session types
export interface Session extends BaseEntity {
    userId: string;
    clientAppId?: string;
    accessToken: string;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
    expiresAt: Date;
    lastActivityAt: Date;
}

// JWT Payload
export interface JwtPayload {
    userId?: string;
    sub?: string; // Standard JWT subject claim
    username?: string;
    email?: string;
    role?: string;
    iat: number;
    exp: number;
}

// User Invite Request (auth-related)
export interface UserInviteRequest {
    email: string;
    role?: string;
}

// Error types
export class AppError extends Error {

    public statusCode: number;

    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

}

// ============================================================================
// New Authentication and Authorization Types
// ============================================================================

// Resource Ownership Types
export enum ResourceOwnership {
    Owner = 'Owner',
    Tenant = 'Tenant',
    System = 'System'
}

// Action Scope Types
export enum ActionScope {
    Owner = 'Owner',
    Tenant = 'Tenant',
    System = 'System',
    Public = 'Public'
}

// Request Type Types
export enum RequestType {
    CreateOne = 'CreateOne',
    GetOne = 'GetOne',
    UpdateOne = 'UpdateOne',
    DeleteOne = 'DeleteOne',
    CreateMany = 'CreateMany',
    GetMany = 'GetMany',
    UpdateMany = 'UpdateMany',
    DeleteMany = 'DeleteMany',
    Search = 'Search',
    Custom = 'Custom'
}

// Current User Interface
export interface CurrentUser {
    UserId: string;
    DisplayName?: string;
    Email?: string;
    Username?: string;
    Roles?: string[];
    Permissions?: string[];
    TenantId?: string;
}

// Current Client Interface
export interface CurrentClient {
    ClientAppId: string;
    Name?: string;
    IsPrivileged?: boolean;
}

// Auth Options Interface
export interface AuthOptions {
    Context: string;
    Ownership: ResourceOwnership;
    ActionScope: ActionScope;
    RequestType: RequestType;
    ClientAppAuth?: boolean;
    CustomAuthorization?: boolean;
    OptionalUserAuth?: boolean;
    PublicAccess?: boolean;
}

// Default Auth Options
export const DefaultAuthOptions: AuthOptions = {
    Context: '',
    Ownership: ResourceOwnership.Owner,
    ActionScope: ActionScope.Tenant,
    RequestType: RequestType.Custom,
    ClientAppAuth: false,
    CustomAuthorization: false,
    OptionalUserAuth: false,
    PublicAccess: false
};

// Auth Result Interface
export interface AuthResult {
    Result: boolean;
    Message?: string;
    HttpErrorCode?: number;
}

// User Context Interface
export interface UserContext {
    UserId?: string;
    TenantId?: string;
    Roles?: string[];
    Permissions?: string[];
}
