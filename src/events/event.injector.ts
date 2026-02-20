import 'reflect-metadata';
import { DependencyContainer } from 'tsyringe';
import { ConfigurationManager } from '../config/configuration.manager';
import { InMemoryMessageBroker } from './brokers/in.memory.message.broker';
import { KafkaMessageBroker } from './brokers/kafka.message.broker';
import { RabbitMqMessageBroker } from './brokers/rabbitmq.message.broker';
import { SqsMessageBroker } from './brokers/sqs.message.broker';
import { GcpPubSubMessageBroker } from './brokers/gcp.pub.sub.message.broker';
import { AzureServiceBusMessageBroker } from './brokers/azure.service.bus.message.broker';

///////////////////////////////////////////////////////////////////////////////

export class EventInjector {

    public static registerInjections(container: DependencyContainer) {
        EventInjector.injectMessageBroker(container);
    }

    private static injectMessageBroker(container: DependencyContainer) {
        const provider = ConfigurationManager.MessageBrokerProvider();
        switch (provider) {
            case 'Kafka':
                container.register('IMessageBroker', KafkaMessageBroker);
                break;
            case 'RabbitMQ':
                container.register('IMessageBroker', RabbitMqMessageBroker);
                break;
            case 'SQS':
                container.register('IMessageBroker', SqsMessageBroker);
                break;
            case 'GcpPubSub':
                container.register('IMessageBroker', GcpPubSubMessageBroker);
                break;
            case 'AzureServiceBus':
                container.register('IMessageBroker', AzureServiceBusMessageBroker);
                break;
            default:
                container.register('IMessageBroker', InMemoryMessageBroker);
                break;
        }
    }

}
