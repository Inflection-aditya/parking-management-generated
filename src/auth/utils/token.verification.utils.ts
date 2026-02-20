import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwksKey } from '../jwks/IJwksKeyCache';
import { getJwtConfiguration } from '../jwks/JwtAuthenticationConfiguration';
import { verifyAccessToken } from './jwt.utils';
import { logger } from '../../logger/logger';

////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Convert JWK to PEM format for JWT verification
 */
export function jwkToPem(jwk: JwksKey): string {
    try {
        const publicKey = crypto.createPublicKey({
            key: {
                kty: 'RSA',
                n: jwk.n,
                e: jwk.e,
            },
            format: 'jwk'
        });
        return publicKey.export({ type: 'spki', format: 'pem' }) as string;
    } catch (error: any) {
        logger.error(`Error converting JWK to PEM: ${error.message}`);
        throw error;
    }
}

/**
 * Get JWKS key using the caching service
 */
export async function getJwksKey(kid: string): Promise<JwksKey | null> {
    try {
        const config = getJwtConfiguration();

        if (!config.isJwtServiceInitialized()) {
            logger.warn('JWT service not initialized, attempting to initialize...');
            try {
                config.configureJwksCaching();
                await config.startBackgroundServices();
                logger.info('JWT service initialized successfully');
            } catch (initError: any) {
                logger.error(`Failed to initialize JWT service: ${initError.message}`);
                return null;
            }
        }

        const jwtService = config.getJwtService();
        return await jwtService.getJwksKeyAsync(kid);
    } catch (error: any) {
        logger.error(`Error getting JWKS key: ${error.message}`);
        return null;
    }
}

/**
 * Unified token verification that supports both RS256 (JWKS) and HS256 (secret) tokens
 */
export async function verifyTokenUnified(token: string): Promise<any> {
    try {
        // Decode token header to check algorithm and kid
        const unverifiedHeader = jwt.decode(token, { complete: true })?.header;
        const kid = unverifiedHeader?.kid;
        const alg = unverifiedHeader?.alg;

        // If token has kid, it's likely RS256 and needs JWKS verification
        if (kid && (alg === 'RS256' || alg === 'RS384' || alg === 'RS512')) {
            const jwksKey = await getJwksKey(kid);
            if (!jwksKey) {
                throw new Error('Unable to find appropriate key for token');
            }

            const publicKeyPem = jwkToPem(jwksKey);
            const config = getJwtConfiguration();

            // Verify token with RSA public key
            // First decode to check issuer/audience before strict verification
            const decoded = jwt.decode(token, { complete: true }) as any;
            const tokenIssuer = decoded?.payload?.iss;
            const tokenAudience = decoded?.payload?.aud;

            const verifyOptions: jwt.VerifyOptions = {
                algorithms: ['RS256', 'RS384', 'RS512'],
            };

            // Set audience - use config audience if available
            // jwt.verify will validate that token audience matches
            if (config.audience) {
                verifyOptions.audience = config.audience;
            }

            // Set issuer - be flexible: prefer token's issuer, fallback to config
            // If token issuer matches common patterns, use it; otherwise use config
            if (tokenIssuer) {
                verifyOptions.issuer = tokenIssuer;
            } else if (config.authority || config.audience) {
                verifyOptions.issuer = config.authority || config.audience;
            }

            const payload = jwt.verify(token, publicKeyPem, verifyOptions) as any;

            // Map RS256 token payload to expected format
            return {
                userId: payload.userId || payload.sub,
                username: payload.username,
                email: payload.email,
                role: payload.roles?.[0] || payload.role,
                tenantId: payload.tenantId,
                ...payload
            };
        } else {
            // Fall back to HS256 secret-based verification
            return verifyAccessToken(token);
        }
    } catch (error: any) {
        logger.error(`Token verification error: ${error.message}`);
        throw error;
    }
}
