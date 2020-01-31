import jwt from 'jsonwebtoken';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Tokens service class.
 * 
 * This service is used to manage tokens.
 */
export default class TokenService extends Service {

    /**
     * Creates a new tokens service.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container);
    }

    /**
     * Encodes a token data.
     * 
     * @param data Token data to encode
     * @param key Key for decoding the token in the future
     * @param expiration Expiration time (in seconds)
     * @returns Token string
     * @async
     */
    public async encode<T extends TokenData>(data: T, key: string, expiration: number = 3600): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            jwt.sign(data, key, { expiresIn: expiration, algorithm: 'HS512' }, (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }

    /**
     * Decodes a token string.
     * 
     * @param token Token string to decode
     * @param key Key for decoding
     * @returns Token data
     * @async
     */
    public async decode<T extends TokenData>(token: string, key: string): Promise<TokenData> {
        return new Promise<TokenData>((resolve, reject) => {
            jwt.verify(token, key, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data as T);
                }
            });
        });
    }
}

/**
 * Token data interface.
 */
export interface TokenData {
    userId: string;
}

/**
 * Access Token data interface.
 */
// tslint:disable-next-line: no-empty-interface
export interface AccessTokenData extends TokenData {}

/**
 * Refresh Token data interface.
 */
// tslint:disable-next-line: no-empty-interface
export interface RefreshTokenData extends TokenData {}
