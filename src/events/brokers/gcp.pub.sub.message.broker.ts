import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';
import { DomainEvent, IMessageBroker } from '../event.types';
import { logger } from '../../logger/logger';


////////////////////////////////////////////////////////////////////////////////

export class GcpPubSubMessageBroker implements IMessageBroker {

    private _client: PubSub | null = null;

    private readonly _projectId: string;

    private readonly _keyFilename?: string;

    private readonly _topics: Map<string, Topic> = new Map();

    private readonly _subscriptions: Map<string, Subscription> = new Map();

    private readonly _consumers: Map<string, (event: DomainEvent) => Promise<void>> = new Map();

    private readonly _logger = logger;

    private _connected = false;

    constructor(
        projectId: string,
        keyFilename?: string
    ) {
        this._projectId = projectId;
        this._keyFilename = keyFilename;
    }

    public async connect(): Promise<void> {
        try {
            if (!this._client) {
                this._client = new PubSub({
                    projectId   : this._projectId,
                    keyFilename : this._keyFilename,
                });
                this._connected = true;
                this._logger.info('✅ Connected to GCP Pub/Sub');
            }
        } catch (error: any) {
            this._logger.error(`Failed to connect to GCP Pub/Sub: ${error.message}`);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            for (const subscription of this._subscriptions.values()) {
                await subscription.close();
            }
            this._subscriptions.clear();
            this._topics.clear();
            this._consumers.clear();
            this._client = null;
            this._connected = false;
            this._logger.info('✅ GCP Pub/Sub disconnected');
        } catch (error: any) {
            this._logger.error(`Error disconnecting from GCP Pub/Sub: ${error.message}`);
            throw error;
        }
    }

    private async getOrCreateTopic(topicName: string): Promise<Topic> {
        if (this._topics.has(topicName)) {
            return this._topics.get(topicName)!;
        }

        if (!this._client) {
            throw new Error('PubSub client not initialized');
        }

        let topic = this._client.topic(topicName);

        const [exists] = await topic.exists();
        if (!exists) {
            [topic] = await topic.create();
            this._logger.info(`Created topic: ${topicName}`);
        }

        this._topics.set(topicName, topic);
        return topic;
    }

    public async publish(topic: string, event: DomainEvent): Promise<void> {
        try {
            if (!this._client) {
                await this.connect();
            }

            if (!this._client) {
                throw new Error('Failed to create PubSub client');
            }

            const topicInstance = await this.getOrCreateTopic(topic);

            const messageBuffer = Buffer.from(JSON.stringify(event));

            await topicInstance.publishMessage({
                data       : messageBuffer,
                attributes : {
                    topic : topic,
                },
            });

            this._logger.debug(`Published message to topic: ${topic}`);
        } catch (error: any) {
            this._logger.error(`Error in GCP Pub/Sub publish: ${error.message}`);
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
                throw new Error('Failed to create PubSub client');
            }

            const topicInstance = await this.getOrCreateTopic(topic);
            const subscriptionName = groupId || `${topic}-subscription`;

            let subscription = this._client.subscription(subscriptionName);

            // Check if subscription exists, create if not
            const [exists] = await subscription.exists();
            if (!exists) {
                [subscription] = await topicInstance.createSubscription(subscriptionName);
                this._logger.info(`Created subscription: ${subscriptionName}`);
            }

            this._subscriptions.set(topic, subscription);
            this._consumers.set(topic, handler);

            subscription.on('message', async (message) => {
                try {
                    const event: DomainEvent = JSON.parse(message.data.toString());

                    const handlerFunc = this._consumers.get(topic);
                    if (handlerFunc) {
                        await handlerFunc(event);
                    }

                    message.ack();
                } catch (error: any) {
                    this._logger.error(`Error processing Pub/Sub message: ${error.message}`);
                    message.nack();
                }
            });

            this._logger.info(`✅ Subscribed to topic: ${topic}`);
        } catch (error: any) {
            this._logger.error(`Error subscribing to GCP Pub/Sub topic ${topic}: ${error.message}`);
            throw error;
        }
    }

    public async unsubscribe(topic: string): Promise<void> {
        try {
            const subscription = this._subscriptions.get(topic);
            if (subscription) {
                await subscription.close();
                this._subscriptions.delete(topic);
            }
            this._consumers.delete(topic);
            this._logger.info(`✅ Unsubscribed from topic: ${topic}`);
        } catch (error: any) {
            this._logger.error(`Error unsubscribing from GCP Pub/Sub topic ${topic}: ${error.message}`);
            throw error;
        }
    }

    public isConnected(): boolean {
        return this._connected;
    }

}

////////////////////////////////////////////////////////////////////////////////
