import { v4 as uuidv4 } from 'uuid';
import { container } from 'tsyringe';
import { DomainEvent, IMessageBroker, EmitOptions } from './event.types';
import { EventStatus } from '../domain.types/event.store.types';
import { uuid } from '../domain.types/miscellaneous/system.types';
import { logger } from '../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class EventEmitter {

    private static _instance: EventEmitter | null = null;

    private _broker: IMessageBroker;

    private _eventStoreService: any = null;

    private constructor() {
        this._broker = container.resolve('IMessageBroker');
    }

    public static instance(): EventEmitter {
        return this._instance || (this._instance = new this());
    }

    private getEventStoreService(): any {
        if (!this._eventStoreService) {
            // Lazy import to avoid pulling in database.connector at module load time
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { EventStoreService } = require('../database/services/event.store.service');
            this._eventStoreService = new EventStoreService();
        }
        return this._eventStoreService;
    }

    public async emit<T>(
        topic: string,
        eventType: string,
        payload: T,
        companyId?: uuid,
        userId?: uuid,
        options?: EmitOptions
    ): Promise<void> {

        const event: DomainEvent<T> = {
            id            : uuidv4(),
            topic,
            eventType,
            version       : 1,
            timestamp     : new Date(),
            source        : process.env.SERVICE_NAME || 'parking-management',
            correlationId : options?.correlationId || uuidv4(),
            companyId,
            userId,
            payload,
            metadata      : options?.metadata,
        };

        const persist = options?.persist !== false;

        // Outbox pattern: persist to DB first
        if (persist) {
            try {
                const store = this.getEventStoreService();
                await store.create({
                    EventId       : event.id,
                    Topic         : topic,
                    EventType     : eventType,
                    Version       : event.version,
                    CorrelationId : event.correlationId,
                    CompanyId     : companyId,
                    UserId        : userId,
                    Payload       : JSON.stringify(payload),
                    Metadata      : options?.metadata ? JSON.stringify(options.metadata) : null,
                    Status        : EventStatus.Pending,
                });
            } catch (error) {
                logger.error(`Failed to persist event ${event.id}: ${error.message}`);
            }
        }

        // Publish to broker
        try {
            await this._broker.publish(topic, event);

            if (persist) {
                const store = this.getEventStoreService();
                await store.updateStatus(event.id, EventStatus.Published);
            }
        } catch (error) {
            logger.error(`Failed to publish event ${event.id} to ${topic}: ${error.message}`);

            if (persist) {
                try {
                    const store = this.getEventStoreService();
                    await store.updateStatus(event.id, EventStatus.Failed, error.message);
                } catch (storeError) {
                    logger.error(`Failed to update event status: ${storeError.message}`);
                }
            }
        }
    }

}
