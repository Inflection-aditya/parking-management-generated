import { BaseSearchFilters, BaseSearchResults } from './miscellaneous/base.search.types';

//////////////////////////////////////////////////////////////

export interface ActivityTracking {
    id           : string;
    userId       : string;
    action       : string;
    resourceType?: string;
    resourceId  ?: string;
    description ?: string;
    ipAddress   ?: string;
    userAgent   ?: string;
    metadata    ?: Record<string, any>;
    status      ?: string;
    errorMessage?: string;
    createdAt    : Date;
}

export interface ActivityTrackingCreateInput {
    userId       : string;
    action       : string;
    resourceType?: string;
    resourceId  ?: string;
    description ?: string;
    ipAddress   ?: string;
    userAgent   ?: string;
    metadata    ?: Record<string, any>;
    status      ?: string;
    errorMessage?: string;
}

export interface ActivityTrackingSearchFilters extends BaseSearchFilters {
    userId      ?: string;
    action      ?: string;
    resourceType?: string;
    status      ?: string;
    startDate   ?: Date;
    endDate     ?: Date;
}

export interface ActivityTrackingResponseDto {
    id           : string;
    userId       : string;
    action       : string;
    resourceType?: string;
    resourceId  ?: string;
    description ?: string;
    ipAddress   ?: string;
    userAgent   ?: string;
    metadata    ?: Record<string, any>;
    status      ?: string;
    errorMessage?: string;
    createdAt    : Date;
}

export interface ActivityTrackingSearchResults extends BaseSearchResults {
    Items: ActivityTrackingResponseDto[];
}

