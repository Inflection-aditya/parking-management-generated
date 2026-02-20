import {
    SQSClient,
    SendMessageCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
    GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import { DomainEvent, IMessageBroker } from '../event.types';
import { logger } from '../../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class SqsMessageBroker implements IMessageBroker {

    private _client: SQSClient | null = null;

    private _connected = false;

    private readonly _region: string;

    private readonly _queueNamePrefix: string;

    private readonly _queueUrls: Map<string, string> = new Map();

    private readonly _pollers: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this._region = process.env.AWS_REGION || 'us-east-1';
        this._queueNamePrefix = process.env.SQS_QUEUE_NAME_PREFIX || 'events';
    }

    public async connect(): Promise<void> {
        if (this._connected) {
            return;
        }

        this._client = new SQSClient({ region: this._region });
        this._connected = true;
        logger.info('SQS broker connected');
    }

    public async disconnect(): Promise<void> {
        for (const poller of this._pollers.values()) {
            clearInterval(poller);
        }
        this._pollers.clear();
        this._queueUrls.clear();
        this._client = null;
        this._connected = false;
        logger.info('SQS broker disconnected');
    }

    public async publish(topic: string, event: DomainEvent): Promise<void> {
        if (!this._client) {
            await this.connect();
        }
        if (!this._client) {
            throw new Error('SQS client is not available');
        }

        const queueUrl = await this.getQueueUrl(topic);

        await this._client.send(new SendMessageCommand({
            QueueUrl          : queueUrl,
            MessageBody       : JSON.stringify(event),
            MessageAttributes : {
                Topic : { DataType: 'String', StringValue: topic },
            },
        }));
    }

    public async subscribe(
        topic: string,
        groupId: string,
        handler: (event: DomainEvent) => Promise<void>
    ): Promise<void> {
        if (!this._client) {
            await this.connect();
        }
        if (!this._client) {
            throw new Error('SQS client is not available');
        }

        const queueUrl = await this.getQueueUrl(topic);
        const pollerKey = `${topic}:${groupId}`;

        const poll = async () => {
            if (!this._client) {
                return;
            }

            try {
                const response = await this._client.send(new ReceiveMessageCommand({
                    QueueUrl            : queueUrl,
                    MaxNumberOfMessages : 10,
                    WaitTimeSeconds     : 20,
                }));

                for (const message of response.Messages || []) {
                    if (!message.Body) {
                        continue;
                    }

                    try {
                        const event = JSON.parse(message.Body) as DomainEvent;
                        await handler(event);

                        if (message.ReceiptHandle) {
                            await this._client.send(new DeleteMessageCommand({
                                QueueUrl      : queueUrl,
                                ReceiptHandle : message.ReceiptHandle,
                            }));
                        }
                    } catch (error: any) {
                        logger.error(`SQS handler error on ${topic}: ${error.message}`);
                    }
                }
            } catch (error: any) {
                logger.error(`SQS polling error on ${topic}: ${error.message}`);
            }
        };

        const existingPoller = this._pollers.get(pollerKey);
        if (existingPoller) {
            clearInterval(existingPoller);
        }

        const poller = setInterval(poll, 1000);
        this._pollers.set(pollerKey, poller);
        void poll();
    }

    public async unsubscribe(topic: string): Promise<void> {
        for (const [key, poller] of this._pollers.entries()) {
            if (key.startsWith(`${topic}:`)) {
                clearInterval(poller);
                this._pollers.delete(key);
            }
        }
    }

    public isConnected(): boolean {
        return this._connected;
    }

    private async getQueueUrl(topic: string): Promise<string> {
        if (!this._client) {
            throw new Error('SQS client is not available');
        }

        const cached = this._queueUrls.get(topic);
        if (cached) {
            return cached;
        }

        const envKey = `SQS_QUEUE_${topic.toUpperCase().replace(/\./g, '_').replace(/[^A-Z0-9_]/g, '_')}`;
        const overrideName = process.env[envKey];
        const sanitizedTopic = topic.replace(/\./g, '-').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
        const prefix = this._queueNamePrefix.endsWith('-') ? this._queueNamePrefix : `${this._queueNamePrefix}-`;
        const queueName = overrideName || `${prefix}${sanitizedTopic}`;

        const response = await this._client.send(new GetQueueUrlCommand({ QueueName: queueName }));
        if (!response.QueueUrl) {
            throw new Error(`SQS queue URL not found for ${queueName}`);
        }

        this._queueUrls.set(topic, response.QueueUrl);
        return response.QueueUrl;
    }

}

///////////////////////////////////////////////////////////////////////////////
