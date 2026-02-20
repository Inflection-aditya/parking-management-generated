/**
 * JWKS Refresh Background Service
 * TypeScript equivalent to .NET JwksRefreshBackgroundService
 */

import { JwtAuthenticationService } from './JwtAuthenticationService';
import { logger } from '../../logger/logger';

export class JwksRefreshBackgroundService {
    private readonly jwtService: JwtAuthenticationService;
    private readonly refreshInterval: number; // in milliseconds
    private intervalId?: NodeJS.Timeout;
    private isRunning = false;

    constructor(jwtService: JwtAuthenticationService, refreshIntervalMinutes: number = 5) {
        this.jwtService = jwtService;
        this.refreshInterval = refreshIntervalMinutes * 60 * 1000; // Convert to milliseconds
    }

    /**
     * Start the background service
     */
    async startAsync(): Promise<void> {
        if (this.isRunning) {
            logger.info('JWKS Refresh Background Service is already running');
            return;
        }

        try {
            logger.info('Starting JWKS refresh background service with ' + this.refreshInterval / 60000 + ' minute interval');

            // Perform initial refresh
            await this.executeRefresh();

            // Set up periodic refresh
            this.intervalId = setInterval(async () => {
                await this.executeRefresh();
            }, this.refreshInterval);

            this.isRunning = true;
            logger.info('JWKS refresh background service started successfully');
        } catch (error: any) {
            logger.error(`Error starting JWKS refresh background service: ${error.message}`);
            throw error;
        }
    }

    /**
     * Stop the background service
     */
    async stopAsync(): Promise<void> {
        if (!this.isRunning) {
            logger.info('JWKS Refresh Background Service is not running');
            return;
        }

        try {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }

            this.isRunning = false;
            logger.info('JWKS Refresh Background Service stopped');
        } catch (error: any) {
            logger.error(`Error stopping JWKS refresh background service: ${error.message}`);
        }
    }

    /**
     * Execute the refresh operation
     */
    private async executeRefresh(): Promise<void> {
        try {
            logger.info('Background JWKS refresh executing...');
            await this.jwtService.refreshKeysAsync();
            logger.info('JWKS keys refresh completed. Cached 1 keys');
        } catch (error: any) {
            logger.error(`Error during JWKS keys refresh: ${error.message}`);
            // Don't throw - we want the background service to continue running
        }
    }

    /**
     * Get the current status of the background service
     */
    public getStatus(): { isRunning: boolean; refreshIntervalMinutes: number } {
        return {
            isRunning: this.isRunning,
            refreshIntervalMinutes: this.refreshInterval / 60000
        };
    }
}
