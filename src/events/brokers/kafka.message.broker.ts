import { Kafka, Producer, Consumer } from 'kafkajs';
import { DomainEvent, IMessageBroker } from '../event.types';
import { logger } from '../../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class KafkaMessageBroker implements IMessageBroker {

    private _kafka: Kafka | null = null;

    private _producer: Producer | null = null;

    private _consumer: Consumer | null = null;

    private _connected = false;

    private readonly _handlers: Map<string, (event: DomainEvent) => Promise<void>> = new Map();

    private readonly _brokers: string[];

    private readonly _clientId: string;

    private _groupId: string;

    constructor(
        brokers?: string[],
        clientId?: string,
        groupId?: string
    ) {
        this._brokers = brokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
        this._clientId = clientId || process.env.KAFKA_CLIENT_ID || 'accounting-service';
        this._groupId = groupId || process.env.KAFKA_GROUP_ID || 'accounting-service-group';
    }

    public async connect(): Promise<void> {
        if (this._connected) {
            return;
        }

        this._kafka = new Kafka({
            clientId : this._clientId,
            brokers  : this._brokers.map(b => b.trim()).filter(Boolean),
            ssl      : process.env.KAFKA_SSL === 'true',
        });

        this._producer = this._kafka.producer();
        await this._producer.connect();

        this._consumer = this._kafka.consumer({ groupId: this._groupId });
        await this._consumer.connect();

        this._connected = true;
        logger.info('Kafka broker connected');
    }

    public async disconnect(): Promise<void> {
        if (this._consumer) {
            await this._consumer.disconnect();
            this._consumer = null;
        }

        if (this._producer) {
            await this._producer.disconnect();
            this._producer = null;
        }

        this._kafka = null;
        this._handlers.clear();
        this._connected = false;
        logger.info('Kafka broker disconnected');
    }

    public async publish(topic: string, event: DomainEvent): Promise<void> {
        if (!this._producer) {
            await this.connect();
        }
        if (!this._producer) {
            throw new Error('Kafka producer is not available');
        }

        await this._producer.send({
            topic,
            messages : [{
                key   : event.id,
                value : JSON.stringify(event),
            }],
        });
    }

    public async subscribe(
        topic: string,
        groupId: string,
        handler: (event: DomainEvent) => Promise<void>
    ): Promise<void> {
        if (!this._consumer) {
            this._groupId = groupId || this._groupId;
            await this.connect();
        }
        if (!this._consumer) {
            throw new Error('Kafka consumer is not available');
        }

        this._handlers.set(topic, handler);
        await this._consumer.subscribe({ topic, fromBeginning: false });

        await this._consumer.run({
            eachMessage : async ({ topic: receivedTopic, message }) => {
                const topicHandler = this._handlers.get(receivedTopic);
                if (!topicHandler || !message.value) {
                    return;
                }

                try {
                    const event = JSON.parse(message.value.toString()) as DomainEvent;
                    await topicHandler(event);
                } catch (error: any) {
                    logger.error(`Kafka message handling failed for ${receivedTopic}: ${error.message}`);
                }
            },
        });
    }

    public async unsubscribe(topic: string): Promise<void> {
        this._handlers.delete(topic);
        if (this._consumer) {
            await this._consumer.stop();
        }
    }

    public isConnected(): boolean {
        return this._connected;
    }

}

///////////////////////////////////////////////////////////////////////////////
