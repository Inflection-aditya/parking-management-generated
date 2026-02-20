import { Repository, Like, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { EventStoreModel } from '../models/event.store.model';
import {
    EventStoreCreateModel,
    EventStoreSearchFilters,
    EventStoreSearchResults,
    EventStoreResponseDto,
    EventStatus
} from '../../../domain.types/event.store.types';
import { BaseService } from './base.service';
import { Source } from '../typeorm.database.connector';
import { logger } from '../../../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class EventStoreService extends BaseService {

    private _eventStoreRepository: Repository<EventStoreModel>;

    constructor() {
        super();
        this._eventStoreRepository = Source.getRepository(EventStoreModel);
    }

    public create = async (model: EventStoreCreateModel): Promise<EventStoreResponseDto> => {
        try {
            const entity = this._eventStoreRepository.create({
                EventId: model.EventId,
                Topic: model.Topic,
                EventType: model.EventType,
                Version: model.Version,
                CorrelationId: model.CorrelationId,
                CompanyId: model.CompanyId,
                UserId: model.UserId,
                Payload: model.Payload,
                Metadata: model.Metadata,
                Status: model.Status,
            });

            const saved = await this._eventStoreRepository.save(entity);
            return this.toResponseDto(saved);
        } catch (error) {
            logger.error(`Error creating event store record: ${error.message}`);
            throw error;
        }
    };

    public getById = async (id: string): Promise<EventStoreResponseDto> => {
        try {
            const record = await this._eventStoreRepository.findOne({ where: { id } });
            return record ? this.toResponseDto(record) : null;
        } catch (error) {
            logger.error(`Error fetching event store record: ${error.message}`);
            throw error;
        }
    };

    public getByEventId = async (eventId: string): Promise<EventStoreResponseDto> => {
        try {
            const record = await this._eventStoreRepository.findOne({ where: { EventId: eventId } });
            return record ? this.toResponseDto(record) : null;
        } catch (error) {
            logger.error(`Error fetching event by EventId: ${error.message}`);
            throw error;
        }
    };

    public updateStatus = async (
        eventId: string,
        status: EventStatus,
        errorMessage?: string
    ): Promise<void> => {
        try {
            const update: any = { Status: status };

            if (status === EventStatus.Published) {
                update.PublishedAt = new Date();
            }
            if (errorMessage) {
                update.LastError = errorMessage;
            }
            if (status === EventStatus.Failed || status === EventStatus.DeadLetter) {
                await this._eventStoreRepository
                    .createQueryBuilder()
                    .update(EventStoreModel)
                    .set({
                        Status: status,
                        LastError: errorMessage || null,
                        RetryCount: () => 'RetryCount + 1',
                    })
                    .where('EventId = :eventId', { eventId })
                    .execute();
                return;
            }

            await this._eventStoreRepository.update({ EventId: eventId }, update);
        } catch (error) {
            logger.error(`Error updating event status: ${error.message}`);
        }
    };

    public search = async (
        filters: EventStoreSearchFilters
    ): Promise<EventStoreSearchResults> => {
        try {
            const search: any = { where: {} };

            if (filters.Topic) {
                search.where.Topic = filters.Topic;
            }
            if (filters.EventType) {
                search.where.EventType = filters.EventType;
            }
            if (filters.CompanyId) {
                search.where.CompanyId = filters.CompanyId;
            }
            if (filters.CorrelationId) {
                search.where.CorrelationId = filters.CorrelationId;
            }
            if (filters.Status) {
                search.where.Status = filters.Status;
            }
            if (filters.FromDate && filters.ToDate) {
                search.where.CreatedAt = Between(filters.FromDate, filters.ToDate);
            } else if (filters.FromDate) {
                search.where.CreatedAt = MoreThanOrEqual(filters.FromDate);
            } else if (filters.ToDate) {
                search.where.CreatedAt = LessThanOrEqual(filters.ToDate);
            }

            const { pageIndex, limit, order, orderByColumn } =
                this.addSortingAndPagination(search, filters);

            const [records, count] = await this._eventStoreRepository.findAndCount(search);

            return {
                TotalCount: count,
                RetrievedCount: records.length,
                PageIndex: pageIndex,
                ItemsPerPage: limit,
                Order: order,
                OrderedBy: orderByColumn,
                Items: records.map(r => this.toResponseDto(r)),
            };
        } catch (error) {
            logger.error(`Error searching event store: ${error.message}`);
            throw error;
        }
    };

    public getFailedEvents = async (limit: number = 100): Promise<EventStoreResponseDto[]> => {
        try {
            const records = await this._eventStoreRepository.find({
                where: { Status: EventStatus.Failed },
                order: { CreatedAt: 'ASC' },
                take: limit,
            });
            return records.map(r => this.toResponseDto(r));
        } catch (error) {
            logger.error(`Error fetching failed events: ${error.message}`);
            throw error;
        }
    };

    //#region Private helpers

    private toResponseDto = (entity: EventStoreModel): EventStoreResponseDto => {
        if (!entity) {
            return null;
        }
        let payload: any = null;
        let metadata: any = null;

        try { payload = JSON.parse(entity.Payload); } catch { payload = entity.Payload; }
        try { metadata = entity.Metadata ? JSON.parse(entity.Metadata) : null; } catch { metadata = entity.Metadata; }

        return {
            id: entity.id,
            EventId: entity.EventId,
            Topic: entity.Topic,
            EventType: entity.EventType,
            Version: entity.Version,
            CorrelationId: entity.CorrelationId,
            CompanyId: entity.CompanyId,
            UserId: entity.UserId,
            Payload: payload,
            Metadata: metadata,
            Status: entity.Status,
            RetryCount: entity.RetryCount,
            LastError: entity.LastError,
            PublishedAt: entity.PublishedAt,
            CreatedAt: entity.CreatedAt,
        };
    };

    //#endregion

}
