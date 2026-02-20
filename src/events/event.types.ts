import { uuid } from '../domain.types/miscellaneous/system.types';

///////////////////////////////////////////////////////////////////////////////

export type MessageBrokerProvider =
    | 'Kafka'
    | 'RabbitMQ'
    | 'SQS'
    | 'InMemory'
    | 'GcpPubSub'
    | 'AzureServiceBus';

///////////////////////////////////////////////////////////////////////////////

export interface DomainEvent<T = any> {
    id            : string;
    topic         : string;
    eventType     : string;
    version       : number;
    timestamp     : Date;
    source        : string;
    correlationId : string;
    companyId    ?: uuid;
    userId       ?: uuid;
    payload       : T;
    metadata     ?: Record<string, any>;
}

///////////////////////////////////////////////////////////////////////////////

export interface IMessageBroker {

    connect(): Promise<void>;

    disconnect(): Promise<void>;

    publish(topic: string, event: DomainEvent): Promise<void>;

    subscribe(
        topic: string,
        groupId: string,
        handler: (event: DomainEvent) => Promise<void>
    ): Promise<void>;

    unsubscribe(topic: string): Promise<void>;

    isConnected(): boolean;

}

///////////////////////////////////////////////////////////////////////////////

export interface IEventHandler {

    /** The topic(s) this handler subscribes to */
    topics: string[];

    /** Handle a single event. Throw to trigger retry. */
    handle(event: DomainEvent): Promise<void>;

}

///////////////////////////////////////////////////////////////////////////////

export interface RetryConfig {
    maxRetries       : number;
    initialDelayMs   : number;
    backoffFactor    : number;
    maxDelayMs       : number;
    queueConcurrency?: number;
}

///////////////////////////////////////////////////////////////////////////////

export interface EmitOptions {
    correlationId ?: string;
    metadata      ?: Record<string, any>;
    persist       ?: boolean;
}
