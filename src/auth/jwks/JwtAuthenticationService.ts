/**
 * JWT Authentication Service
 * TypeScript equivalent to .NET JwtAuthenticationService
 */

import axios from 'axios';
import { IJwksKeyCache, JwksKey } from './IJwksKeyCache';
import { logger } from '../../logger/logger';

export interface JwksResponse {
    keys: JwksKey[];
}

export class JwtAuthenticationService {
    private readonly httpClient = axios.create({
        timeout: 10000,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Service-JWKS-Client/1.0'
        }
    });
    
    private readonly jwksUrl: string;
    private readonly jwksCache: IJwksKeyCache;
    private lastRefresh: Date = new Date(0);
    private readonly refreshInterval: number = 5 * 60 * 1000; // 5 minutes in ms

    constructor(jwksUrl: string, jwksCache: IJwksKeyCache) {
        this.jwksUrl = jwksUrl;
        this.jwksCache = jwksCache;
    }

    /**
     * Get signing keys for JWT verification
     * @param kid Key ID
     * @returns Array of security keys (for compatibility with .NET interface)
     */
    async getSigningKeysAsync(kid: string): Promise<JwksKey[]> {
        // Check cache first
        const cachedKey = await this.jwksCache.tryGetAsync(kid);
        if (cachedKey && !cachedKey.isExpired) {
            logger.debug(`Using cached key for kid: ${kid}`);
            return [cachedKey.jwksKey];
        }

        // Check if we need to refresh keys
        if (this.shouldRefreshKeys()) {
            await this.refreshKeysAsync();
        }

        // Try cache again after refresh
        const refreshedKey = await this.jwksCache.tryGetAsync(kid);
        if (refreshedKey && !refreshedKey.isExpired) {
            logger.debug(`Using refreshed cached key for kid: ${kid}`);
            return [refreshedKey.jwksKey];
        }

        logger.warn(`No valid key found for kid: ${kid}`);
        return [];
    }

    /**
     * Refresh JWKS keys from the authority
     */
    async refreshKeysAsync(): Promise<void> {
        try {
            logger.info(`Refreshing JWKS keys from: ${this.jwksUrl}`);

            const response = await this.httpClient.get<JwksResponse>(this.jwksUrl);
            const jwks = response.data;

            if (jwks?.keys) {
                logger.info(`Received ${jwks.keys.length} keys from JWKS`);

                // Add or update keys in cache
                const ttl = 10 * 60 * 1000; // 10 minutes in milliseconds
                for (const jwksKey of jwks.keys) {
                    await this.jwksCache.setAsync(jwksKey.kid, jwksKey, ttl);
                    logger.debug(`Cached key with kid: ${jwksKey.kid}`);
                }

                this.lastRefresh = new Date();
                logger.info('Successfully refreshed and cached keys');
            }
        } catch (error: any) {
            logger.error(`Error refreshing JWKS keys: ${error.message}`);
            throw error;
        }
    }

    private shouldRefreshKeys(): boolean {
        const now = new Date();
        return (now.getTime() - this.lastRefresh.getTime()) > this.refreshInterval;
    }

    /**
     * Get a single JWKS key by kid (for direct usage)
     */
    async getJwksKeyAsync(kid: string): Promise<JwksKey | null> {
        const keys = await this.getSigningKeysAsync(kid);
        return keys.length > 0 ? keys[0] : null;
    }
}
