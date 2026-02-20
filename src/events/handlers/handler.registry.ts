import { IEventHandler } from '../event.types';
import { UserSignUpEventHandler } from './user.sign.up.event.handler';

///////////////////////////////////////////////////////////////////////////////

export class HandlerRegistry {

    private static _handlers: Map<string, IEventHandler[]> = new Map();

    public static registerAll(): void {
        const handlers: IEventHandler[] = [
            new UserSignUpEventHandler(),
        ];

        for (const handler of handlers) {
            for (const topic of handler.topics) {
                if (!this._handlers.has(topic)) {
                    this._handlers.set(topic, []);
                }
                this._handlers.get(topic).push(handler);
            }
        }
    }

    public static register(handler: IEventHandler): void {
        for (const topic of handler.topics) {
            if (!this._handlers.has(topic)) {
                this._handlers.set(topic, []);
            }
            this._handlers.get(topic).push(handler);
        }
    }

    public static getAll(): Map<string, IEventHandler[]> {
        return this._handlers;
    }

    public static getHandlers(topic: string): IEventHandler[] {
        return this._handlers.get(topic) || [];
    }

    public static clear(): void {
        this._handlers.clear();
    }

}
