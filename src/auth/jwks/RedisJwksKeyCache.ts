/**
 * Redis JWKS Key Cache
 * TypeScript equivalent to .NET RedisJwksKeyCache
 */

import { createClient, RedisClientType } from 'redis';
import { IJwksKeyCache, JwksKey, CachedSecurityKey } from './IJwksKeyCache';
import { logger } from '../../logger/logger';

export class RedisJwksKeyCache implements IJwksKeyCache {
    private client: RedisClientType;
    private readonly keyPrefix = 'jwks:kid:';
    private isConnected = false;

    constructor(redisUrl: string) {
        this.client = createClient({
            url: redisUrl
        });

        this.client.on('error', (error) => {
            logger.error(`Redis client error: ${error}`);
        });

        this.client.on('connect', () => {
            logger.info('Connected to Redis server for JWKS caching');
            this.isConnected = true;
        });

        this.client.on('disconnect', () => {
            logger.info('Disconnected from Redis server');
            this.isConnected = false;
        });
    }

    private async ensureConnected(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }

    async tryGetAsync(kid: string): Promise<CachedSecurityKey | null> {
        try {
            await this.ensureConnected();
            
            const key = this.keyPrefix + kid;
            const cached = await this.client.get(key);
            
            if (!cached) {
                return null;
            }

            const data = JSON.parse(cached as string);
            const expiresAt = new Date(data.expiresAt);
            const now = new Date();

            if (now > expiresAt) {
                // Entry expired, remove it
                await this.client.del(key);
                return null;
            }

            return {
                jwksKey: data.jwk,
                cachedAt: new Date(data.cachedAt),
                expiresAt: expiresAt,
                isExpired: false
            };
        } catch (error) {
            logger.error(`Error getting key from Redis cache: ${error}`);
            return null;
        }
    }

    async setAsync(kid: string, jwk: JwksKey, ttlMs: number): Promise<void> {
        try {
            await this.ensureConnected();
            
            const key = this.keyPrefix + kid;
            const data = {
                jwk,
                cachedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + ttlMs).toISOString()
            };

            await this.client.setEx(key, Math.floor(ttlMs / 1000), JSON.stringify(data));
        } catch (error) {
            logger.error(`Error setting key in Redis cache: ${error}`);
        }
    }

    async removeAsync(kid: string): Promise<void> {
        try {
            await this.ensureConnected();
            
            const key = this.keyPrefix + kid;
            await this.client.del(key);
        } catch (error) {
            logger.error(`Error removing key from Redis cache: ${error}`);
        }
    }

    public async clearAll(): Promise<void> {
        try {
            await this.ensureConnected();
            
            const keys = await this.client.keys(this.keyPrefix + '*');
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            logger.error(`Error clearing Redis cache: ${error}`);
        }
    }

    public async disconnect(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
            }
        } catch (error) {
            logger.error(`Error disconnecting from Redis: ${error}`);
        }
    }
}
