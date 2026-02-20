import { BaseSearchFilters, BaseSearchResults } from './miscellaneous/base.search.types';
import { uuid } from './miscellaneous/system.types';

///////////////////////////////////////////////////////////////////////////////

export enum EventStatus {
    Pending    = 'Pending',
    Published  = 'Published',
    Failed     = 'Failed',
    DeadLetter = 'DeadLetter',
}

///////////////////////////////////////////////////////////////////////////////

export interface EventStoreCreateModel {
    EventId        : string;
    Topic          : string;
    EventType      : string;
    Version        : number;
    CorrelationId  : string;
    CompanyId     ?: uuid;
    UserId        ?: uuid;
    Payload        : string;
    Metadata      ?: string;
    Status         : EventStatus;
}

///////////////////////////////////////////////////////////////////////////////

export interface EventStoreSearchFilters extends BaseSearchFilters {
    Topic         ?: string;
    EventType     ?: string;
    CompanyId     ?: uuid;
    CorrelationId ?: string;
    Status        ?: EventStatus;
    FromDate      ?: Date;
    ToDate        ?: Date;
}

///////////////////////////////////////////////////////////////////////////////

export interface EventStoreResponseDto {
    id             : string;
    EventId        : string;
    Topic          : string;
    EventType      : string;
    Version        : number;
    CorrelationId  : string;
    CompanyId      : uuid;
    UserId         : uuid;
    Payload        : any;
    Metadata       : any;
    Status         : EventStatus;
    RetryCount     : number;
    LastError      : string;
    PublishedAt   ?: Date;
    CreatedAt      : Date;
}

///////////////////////////////////////////////////////////////////////////////

export interface EventStoreSearchResults extends BaseSearchResults {
    Items : EventStoreResponseDto[];
}
