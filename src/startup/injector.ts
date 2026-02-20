import 'reflect-metadata';
import { DependencyContainer, container } from 'tsyringe';
import { ConfigurationManager } from '../config/configuration.manager';
import { DatabaseInjector } from '../database/database.injector';
//import { AuthInjector } from '../auth/auth.injector';
import { ModuleInjector } from '../modules/module.injector';
import { EventInjector } from '../events/event.injector';

//////////////////////////////////////////////////////////////////////

export class Injector {

    private static _container: DependencyContainer = container;

    public static get Container() {
        return Injector._container;
    }
    
    static registerInjections() {
        ConfigurationManager.initialize();
        ModuleInjector.registerInjections(Injector.Container);
        //AuthInjector.registerInjections(Injector.Container);
        DatabaseInjector.registerInjections(Injector.Container);
        EventInjector.registerInjections(Injector.Container);
    }

}
