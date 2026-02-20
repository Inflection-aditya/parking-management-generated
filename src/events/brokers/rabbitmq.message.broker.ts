import * as amqp from 'amqplib';
import { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { DomainEvent, IMessageBroker } from '../event.types';
import { logger } from '../../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class RabbitMqMessageBroker implements IMessageBroker {

    private _connection: ChannelModel | null = null;

    private _channel: Channel | null = null;

    private _connected = false;

    private readonly _consumerTags: Map<string, string> = new Map();

    private readonly _connectionUrl: string;

    private readonly _exchangeName: string;

    constructor() {
        const host = process.env.RABBITMQ_HOST || 'localhost';
        const port = process.env.RABBITMQ_PORT || '5672';
        const username = process.env.RABBITMQ_USERNAME || 'guest';
        const password = process.env.RABBITMQ_PASSWORD || 'guest';
        const vhost = process.env.RABBITMQ_VHOST || '/';
        this._exchangeName = process.env.RABBITMQ_EXCHANGE_NAME || 'events';
        this._connectionUrl = `amqp://${username}:${password}@${host}:${port}${vhost}`;
    }

    public async connect(): Promise<void> {
        if (this._connected) {
            return;
        }

        this._connection = await amqp.connect(this._connectionUrl);
        this._channel = await this._connection.createChannel();
        await this._channel.assertExchange(this._exchangeName, 'topic', { durable: true });

        this._connection.on('close', () => {
            this._connected = false;
            this._channel = null;
            this._connection = null;
            logger.warn('RabbitMQ connection closed');
        });

        this._connection.on('error', (error: any) => {
            logger.error(`RabbitMQ connection error: ${error.message}`);
        });

        this._connected = true;
        logger.info('RabbitMQ broker connected');
    }

    public async disconnect(): Promise<void> {
        if (this._channel) {
            await this._channel.close();
            this._channel = null;
        }

        if (this._connection) {
            await this._connection.close();
            this._connection = null;
        }

        this._consumerTags.clear();
        this._connected = false;
        logger.info('RabbitMQ broker disconnected');
    }

    public async publish(topic: string, event: DomainEvent): Promise<void> {
        if (!this._channel) {
            await this.connect();
        }
        if (!this._channel) {
            throw new Error('RabbitMQ channel is not available');
        }

        const published = this._channel.publish(
            this._exchangeName,
            topic,
            Buffer.from(JSON.stringify(event)),
            { persistent: true, contentType: 'application/json' }
        );

        if (!published) {
            throw new Error('RabbitMQ publish returned false due to backpressure');
        }
    }

    public async subscribe(
        topic: string,
        groupId: string,
        handler: (event: DomainEvent) => Promise<void>
    ): Promise<void> {
        if (!this._channel) {
            await this.connect();
        }
        if (!this._channel) {
            throw new Error('RabbitMQ channel is not available');
        }

        const queueName = `${this._exchangeName}.${groupId}.${topic}`
            .replace(/[^a-zA-Z0-9._-]/g, '-')
            .slice(0, 255);

        await this._channel.assertQueue(queueName, { durable: true });
        await this._channel.bindQueue(queueName, this._exchangeName, topic);

        const onMessage = async (msg: ConsumeMessage | null) => {
            if (!msg || !this._channel) {
                return;
            }

            try {
                const event = JSON.parse(msg.content.toString()) as DomainEvent;
                await handler(event);
                this._channel.ack(msg);
            } catch (error: any) {
                logger.error(`RabbitMQ handler error on ${topic}: ${error.message}`);
                this._channel.nack(msg, false, true);
            }
        };

        const consumeResult = await this._channel.consume(queueName, onMessage, { noAck: false });
        this._consumerTags.set(topic, consumeResult.consumerTag);
    }

    public async unsubscribe(topic: string): Promise<void> {
        if (!this._channel) {
            return;
        }
        const tag = this._consumerTags.get(topic);
        if (tag) {
            await this._channel.cancel(tag);
            this._consumerTags.delete(topic);
        }
    }

    public isConnected(): boolean {
        return this._connected;
    }

}

///////////////////////////////////////////////////////////////////////////////
