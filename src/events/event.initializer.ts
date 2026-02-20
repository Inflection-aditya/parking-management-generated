import { container } from 'tsyringe';
import { IMessageBroker } from './event.types';
import { EventListener } from './event.listener';
import { HandlerRegistry } from './handlers/handler.registry';
import { logger } from '../logger/logger';

///////////////////////////////////////////////////////////////////////////////

export class EventInitializer {

    public static async initialize(): Promise<void> {
        try {
            // 1. Connect the broker
            const broker: IMessageBroker = container.resolve('IMessageBroker');
            await broker.connect();
            logger.info('Message broker connected');

            // 2. Register all event handlers
            HandlerRegistry.registerAll();
            logger.info('Event handlers registered');

            // 3. Start listening
            const listener = EventListener.instance();
            await listener.startAll();
            logger.info('Event listeners started');

        } catch (error) {
            logger.error(`Failed to initialize event system: ${error.message}`);
            // Non-fatal: the service can run without events
        }
    }

    public static async shutdown(): Promise<void> {
        try {
            const broker: IMessageBroker = container.resolve('IMessageBroker');
            await broker.disconnect();
            logger.info('Message broker disconnected');
        } catch (error) {
            logger.error(`Error during event system shutdown: ${error.message}`);
        }
    }

}
