import async from 'async';
import { container } from 'tsyringe';
import { DomainEvent, IMessageBroker, IEventHandler, RetryConfig } from './event.types';
import { ConsumerGroups, DEAD_LETTER_SUFFIX, DEFAULT_RETRY_CONFIG, DEFAULT_QUEUE_CONCURRENCY } from './event.constants';
import { EventStatus } from '../domain.types/event.store.types';
import { logger } from '../logger/logger';

///////////////////////////////////////////////////////////////////////////////

interface QueueTask {
    event    : DomainEvent;
    handlers : IEventHandler[];
}

///////////////////////////////////////////////////////////////////////////////

export class EventListener {

    private static _instance: EventListener | null = null;

    private _broker: IMessageBroker;

    private _queue: async.QueueObject<QueueTask> | null = null;

    private _eventStoreService: any = null;

    private constructor() {
        this._broker = container.resolve('IMessageBroker');
    }

    public static instance(): EventListener {
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

    public async startAll(concurrency?: number): Promise<void> {
        const { HandlerRegistry } = require('./handlers/handler.registry');
        const handlers = HandlerRegistry.getAll();
        const consumerGroup = ConsumerGroups.PARKING_MANAGEMENT;
        const queueConcurrency = concurrency || DEFAULT_QUEUE_CONCURRENCY;

        // Initialize the processing queue with controlled concurrency
        this._queue = async.queue<QueueTask>(async (task: QueueTask) => {
            await this.handleWithRetry(task.event, task.handlers);
        }, queueConcurrency);

        this._queue.error((err, task: QueueTask) => {
            logger.error(
                `Queue processing error for event ${task.event.id} ` +
                `on ${task.event.topic}: ${err.message}`
            );
        });

        this._queue.drain(() => {
            logger.debug('Event processing queue drained ??? all tasks complete');
        });

        logger.info(`Event queue initialized with concurrency: ${queueConcurrency}`);

        for (const [topic, handlerList] of handlers) {
            await this._broker.subscribe(topic, consumerGroup, async (event) => {
                // Push onto the queue instead of processing inline
                this._queue.push({ event, handlers: handlerList });
            });
            logger.info(`Listening on topic: ${topic} (${handlerList.length} handler(s))`);
        }
    }

    public async shutdown(): Promise<void> {
        if (this._queue) {
            this._queue.kill();
            logger.info('Event processing queue shut down');
        }
    }

    public async handleWithRetry(
        event: DomainEvent,
        handlers: IEventHandler[],
        config: RetryConfig = DEFAULT_RETRY_CONFIG
    ): Promise<void> {

        for (const handler of handlers) {
            let attempt = 0;
            let lastError: Error | null = null;

            while (attempt <= config.maxRetries) {
                try {
                    await handler.handle(event);
                    lastError = null;
                    break;
                } catch (error) {
                    lastError = error;
                    attempt++;
                    if (attempt <= config.maxRetries) {
                        const delay = Math.min(
                            config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1),
                            config.maxDelayMs
                        );
                        logger.warn(
                            `Retry ${attempt}/${config.maxRetries} for event ` +
                            `${event.id} on ${event.topic}: ${error.message}. ` +
                            `Waiting ${delay}ms.`
                        );
                        await this.sleep(delay);
                    }
                }
            }

            if (lastError) {
                logger.error(
                    `Dead-lettering event ${event.id} on ${event.topic} ` +
                    `after ${config.maxRetries} retries: ${lastError.message}`
                );
                await this.sendToDeadLetter(event, lastError);
            }
        }
    }

    //#region Private helpers

    private async sendToDeadLetter(event: DomainEvent, error: Error): Promise<void> {
        try {
            await this._broker.publish(`${event.topic}${DEAD_LETTER_SUFFIX}`, {
                ...event,
                metadata: {
                    ...event.metadata,
                    originalTopic  : event.topic,
                    error          : error.message,
                    deadLetteredAt : new Date().toISOString(),
                },
            });

            try {
                const store = this.getEventStoreService();
                await store.updateStatus(event.id, EventStatus.DeadLetter, error.message);
            } catch (storeError) {
                logger.error(`Failed to update dead-letter status: ${storeError.message}`);
            }
        } catch (dlqError) {
            logger.error(`Failed to dead-letter event ${event.id}: ${dlqError.message}`);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //#endregion

}
