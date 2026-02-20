import { ServiceBusClient, ServiceBusSender, ServiceBusReceiver, ServiceBusReceivedMessage } from '@azure/service-bus';
import { DomainEvent, IMessageBroker } from '../event.types';
import { logger } from '../../logger/logger';

export class AzureServiceBusMessageBroker implements IMessageBroker {

    private _client: ServiceBusClient | null = null;

    private readonly _connectionString?: string;

    private readonly _namespace?: string;

    private readonly _sasPolicyName?: string;

    private readonly _sasKey?: string;

    private readonly _topicName?: string;

    private readonly _queueName?: string;

    private readonly _senders: Map<string, ServiceBusSender> = new Map();

    private readonly _receivers: Map<string, ServiceBusReceiver> = new Map();

    private readonly _consumers: Map<string, (event: DomainEvent) => Promise<void>> = new Map();

    private _connected = false;

    constructor(
        connectionString?: string,
        namespace?: string,
        sasPolicyName?: string,
        sasKey?: string,
        topicName?: string,
        queueName?: string
    ) {
        this._connectionString = connectionString;
        this._namespace = namespace;
        this._sasPolicyName = sasPolicyName;
        this._sasKey = sasKey;
        this._topicName = topicName;
        this._queueName = queueName;

        if (!connectionString && (!namespace || !sasPolicyName || !sasKey)) {
            throw new Error(
                'Azure Service Bus configuration incomplete. ' +
                'Provide either AZURE_SERVICE_BUS_CONNECTION_STRING or ' +
                'AZURE_SERVICE_BUS_NAMESPACE, AZURE_SERVICE_BUS_SAS_POLICY_NAME, and AZURE_SERVICE_BUS_SAS_KEY'
            );
        }
    }

    public async connect(): Promise<void> {
        try {
            if (!this._client) {
                if (this._connectionString) {
                    this._client = new ServiceBusClient(this._connectionString);
                } else if (this._namespace && this._sasPolicyName && this._sasKey) {
                    const namespaceUrl = this._namespace.endsWith('.servicebus.windows.net')
                        ? this._namespace
                        : `${this._namespace}.servicebus.windows.net`;

                    const connectionString = `Endpoint=sb://${namespaceUrl}/;SharedAccessKeyName=${this._sasPolicyName};SharedAccessKey=${this._sasKey}`;
                    this._client = new ServiceBusClient(connectionString);
                } else {
                    throw new Error('Azure Service Bus configuration is incomplete');
                }

                this._connected = true;
                logger.info('✅ Connected to Azure Service Bus');
            }
        } catch (error: any) {
            logger.error(`Failed to connect to Azure Service Bus: ${error.message}`);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            for (const receiver of this._receivers.values()) {
                await receiver.close();
            }
            this._receivers.clear();

            for (const sender of this._senders.values()) {
                await sender.close();
            }
            this._senders.clear();

            if (this._client) {
                await this._client.close();
                this._client = null;
            }

            this._consumers.clear();
            this._connected = false;
            logger.info('✅ Azure Service Bus disconnected');
        } catch (error: any) {
            logger.error(`Error disconnecting from Azure Service Bus: ${error.message}`);
            throw error;
        }
    }

    private async getOrCreateSender(topicOrQueueName: string): Promise<ServiceBusSender> {
        const existingSender = this._senders.get(topicOrQueueName);
        if (existingSender) {
            return existingSender;
        }

        if (!this._client) {
            throw new Error('ServiceBus client not initialized');
        }

        const sender = this._client.createSender(topicOrQueueName);
        this._senders.set(topicOrQueueName, sender);
        return sender;
    }

    private async getOrCreateReceiver(topicOrQueueName: string, subscriptionName?: string): Promise<ServiceBusReceiver> {
        const key = subscriptionName ? `${topicOrQueueName}/${subscriptionName}` : topicOrQueueName;

        const existingReceiver = this._receivers.get(key);
        if (existingReceiver) {
            return existingReceiver;
        }

        if (!this._client) {
            throw new Error('ServiceBus client not initialized');
        }

        const receiver: ServiceBusReceiver = subscriptionName
            ? this._client.createReceiver(topicOrQueueName, subscriptionName)
            : this._client.createReceiver(topicOrQueueName);

        this._receivers.set(key, receiver);
        return receiver;
    }

    public async publish(topic: string, event: DomainEvent): Promise<void> {
        try {
            if (!this._client) {
                await this.connect();
            }

            if (!this._client) {
                throw new Error('Failed to create ServiceBus client');
            }

            const topicOrQueueName = this._topicName || topic;
            const sender = await this.getOrCreateSender(topicOrQueueName);

            await sender.sendMessages({
                body                  : JSON.stringify(event),
                contentType           : 'application/json',
                subject               : topic,
                applicationProperties : {
                    topic : topic,
                },
            });

            logger.debug(`Published message to topic/queue: ${topic}`);
        } catch (error: any) {
            logger.error(`Error in Azure Service Bus publish: ${error.message}`);
            throw error;
        }
    }

    public async subscribe(
        topic: string,
        groupId: string,
        handler: (event: DomainEvent) => Promise<void>
    ): Promise<void> {
        try {
            if (!this._client) {
                await this.connect();
            }

            if (!this._client) {
                throw new Error('Failed to create ServiceBus client');
            }

            let topicOrQueueName = topic;
            let subscriptionName: string | undefined = groupId || `${topic}-subscription`;

            if (this._queueName) {
                // Use queue - no subscription needed
                topicOrQueueName = this._queueName;
                subscriptionName = undefined;
            } else if (this._topicName) {
                // Use topic with subscription
                topicOrQueueName = this._topicName;
                subscriptionName = groupId || `${topicOrQueueName}-subscription`;
            }

            const receiver = await this.getOrCreateReceiver(topicOrQueueName, subscriptionName);

            this._consumers.set(topic, handler);

            const extractErrorMessage = (error: any): string => {
                if (!error) return 'Unknown error';
                if (error.message) return error.message;
                if (typeof error === 'string') return error;
                return JSON.stringify(error, null, 2);
            };

            const processMessage = async (message: ServiceBusReceivedMessage) => {
                try {
                    const handlerFunc = this._consumers.get(topic);
                    if (handlerFunc) {
                        const event = JSON.parse(message.body as string) as DomainEvent;
                        await handlerFunc(event);
                    }

                    await receiver.completeMessage(message);
                } catch (error: any) {
                    const errorMessage = extractErrorMessage(error);
                    const errorDetails = error?.stack ? `\nStack: ${error.stack}` : '';
                    logger.error(`Error processing Azure Service Bus message: ${errorMessage}${errorDetails}`);
                    await receiver.abandonMessage(message);
                }
            };

            const processError = async (error: any) => {
                const errorMessage = extractErrorMessage(error);
                const errorDetails = error?.stack ? `\nStack: ${error.stack}` : '';
                logger.error(`Error receiving Azure Service Bus messages: ${errorMessage}${errorDetails}`);
            };

            receiver.subscribe({
                processMessage,
                processError,
            });

            logger.info(`✅ Subscribed to topic/queue: ${topic}`);
        } catch (error: any) {
            logger.error(`Error subscribing to Azure Service Bus topic ${topic}: ${error.message}`);
            throw error;
        }
    }

    public async unsubscribe(topic: string): Promise<void> {
        try {
            // Determine the key based on whether it's a queue or topic
            let topicOrQueueName = topic;
            let key = '';

            if (this._queueName) {
                // Queue - no subscription
                topicOrQueueName = this._queueName;
                key = topicOrQueueName;
            } else if (this._topicName) {
                // Topic with subscription
                topicOrQueueName = this._topicName;
                const subscriptionName = `${topicOrQueueName}-subscription`;
                key = `${topicOrQueueName}/${subscriptionName}`;
            } else {
                // Use provided topic with subscription
                const subscriptionName = `${topic}-subscription`;
                key = `${topic}/${subscriptionName}`;
            }

            const receiver = this._receivers.get(key);

            if (receiver) {
                await receiver.close();
                this._receivers.delete(key);
            }

            const sender = this._senders.get(topicOrQueueName);
            if (sender) {
                await sender.close();
                this._senders.delete(topicOrQueueName);
            }

            this._consumers.delete(topic);
            logger.info(`✅ Unsubscribed from topic: ${topic}`);
        } catch (error: any) {
            logger.error(`Error unsubscribing from Azure Service Bus topic ${topic}: ${error.message}`);
            throw error;
        }
    }

    public isConnected(): boolean {
        return this._connected;
    }

}
