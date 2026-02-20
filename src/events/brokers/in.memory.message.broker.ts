import { DomainEvent, IMessageBroker } from '../event.types';
import { logger } from '../../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class InMemoryMessageBroker implements IMessageBroker {

    private _connected = false;

    private _subscriptions: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

    async connect(): Promise<void> {
        this._connected = true;
        logger.info('InMemory message broker connected');
    }

    async disconnect(): Promise<void> {
        this._connected = false;
        this._subscriptions.clear();
        logger.info('InMemory message broker disconnected');
    }

    async publish(topic: string, event: DomainEvent): Promise<void> {
        if (!this._connected) {
            throw new Error('InMemory broker is not connected');
        }

        const handlers = this._subscriptions.get(topic) || [];
        for (const handler of handlers) {
            // Process asynchronously — don't block the publisher
            setImmediate(() => {
                handler(event).catch(err => {
                    logger.error(`InMemory handler error on ${topic}: ${err.message}`);
                });
            });
        }
    }

    async subscribe(
        topic: string,
        groupId: string,
        handler: (event: DomainEvent) => Promise<void>
    ): Promise<void> {
        if (!this._subscriptions.has(topic)) {
            this._subscriptions.set(topic, []);
        }
        this._subscriptions.get(topic).push(handler);
        logger.info(`InMemory: subscribed to ${topic} [group=${groupId}]`);
    }

    async unsubscribe(topic: string): Promise<void> {
        this._subscriptions.delete(topic);
        logger.info(`InMemory: unsubscribed from ${topic}`);
    }

    isConnected(): boolean {
        return this._connected;
    }

}
