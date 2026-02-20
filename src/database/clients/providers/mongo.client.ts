import { MongoClient } from 'mongodb';
import { logger } from '../../../logger/logger';
import { DatabaseSchema, getDatabaseConfig } from '../../database.configs';
import { IDatabaseClient } from '../database.client.interface';

//////////////////////////////////////////////////////////////////////////////

export class MongoDbClient implements IDatabaseClient {

    private getClient = async (schemaType: DatabaseSchema): Promise<MongoClient> => {
        const config = getDatabaseConfig(schemaType);

        const uri = `mongodb://${config?.Username}:${config?.Password}@${config?.Host}:${config?.Port}`;

        const client = new MongoClient(uri);
        await client.connect();

        return client;
    };

    public createDb = async (schemaType: DatabaseSchema): Promise<boolean> => {
        try {
            const config = getDatabaseConfig(schemaType);
            const client = await this.getClient(schemaType);

            // MongoDB creates DB on first write
            const db = client.db(config?.DatabaseName);
            await db.createCollection('__init__');

            await client.close();
            return true;
        } catch (error: any) {
            logger.error(error.message);
            return false;
        }
    };

    public dropDb = async (schemaType: DatabaseSchema): Promise<boolean> => {
        try {
            const config = getDatabaseConfig(schemaType);
            const client = await this.getClient(schemaType);

            const db = client.db(config?.DatabaseName);
            await db.dropDatabase();

            await client.close();
            return true;
        } catch (error: any) {
            logger.error(error.message);
            return false;
        }
    };


    public executeQuery = async (
        schemaType: DatabaseSchema,
        query: string
    ): Promise<boolean> => {
        try {
            const config = getDatabaseConfig(schemaType);
            const client = await this.getClient(schemaType);

            const db = client.db(config?.DatabaseName);
            // Expect a JSON string command to keep the interface compatible
            const command = JSON.parse(query) as Record<string, any>;
            await db.command(command);

            await client.close();
            return true;
        } catch (error: any) {
            logger.error(error.message);
            return false;
        }
    };

}
