import { BaseSearchFilters, BaseSearchResults } from './miscellaneous/base.search.types';

//////////////////////////////////////////////////////////////

export interface ClientApp {
    id                : string;
    name              : string;
    code              : string;
    apiKey           ?: string;
    description       : string;
    ownerUserId       : string;
    redirectUri      ?: string;
    logoUrl          ?: string;
    websiteUrl       ?: string;
    privacyPolicyUrl ?: string;
    termsOfServiceUrl?: string;
    isVerified        : boolean;
    isActive          : boolean;
    createdAt         : Date;
    updatedAt         : Date;
}

export interface ClientAppCreateInput {
    name              : string;
    code              : string;
    description       : string;
    apiKey           ?: string;
    ownerUserId       : string;
    organizationId   ?: string;
    isVerified        : boolean;
    isActive          : boolean;
    status            : string;
    redirectUri      ?: string;
    logoUrl          ?: string;
    websiteUrl       ?: string;
    privacyPolicyUrl ?: string;
    termsOfServiceUrl?: string;
}

export interface ClientAppUpdateInput {
    name             ?: string;
    code             ?: string;
    description      ?: string;
    redirectUri      ?: string;
    logoUrl          ?: string;
    websiteUrl       ?: string;
    privacyPolicyUrl ?: string;
    termsOfServiceUrl?: string;
    isVerified       ?: boolean;
    isActive         ?: boolean;
}

export interface ClientAppResponseDto {
    id                : string;
    name              : string;
    code              : string;
    apiKey           ?: string;
    description       : string;
    ownerUserId       : string;
    redirectUri      ?: string;
    logoUrl          ?: string;
    websiteUrl       ?: string;
    privacyPolicyUrl ?: string;
    termsOfServiceUrl?: string;
    isVerified        : boolean;
    isActive          : boolean;
    createdAt         : Date;
    updatedAt         : Date;
}

export interface ClientAppSearchFilters extends BaseSearchFilters {
    name       ?: string;
    code       ?: string;
    ownerUserId?: string;
    isVerified ?: boolean;
    isActive   ?: boolean;
}

export interface ClientAppSearchResults extends BaseSearchResults {
    Items: ClientAppResponseDto[];
}

// Type aliases for compatibility
export type IClientApp = ClientApp;

