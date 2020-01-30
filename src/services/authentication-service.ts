import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Authentication service class.
 * 
 * This service is used to manage authentication for users with tokens and hashing strings like passwords.
 */
export default class AuthenticationService extends Service {

    /**
     * Creates a new authentication service.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container);
        this.authenticateHandler = this.authenticateHandler.bind(this);
        this.isAuthenticatedHandler = this.isAuthenticatedHandler.bind(this);
    }

    /**
     * Hashes a string.
     * 
     * @param str String to hash
     * @param salt Salt for hash
     * @returns Hashed string
     * @async
     */
    public async hash(str: string, salt: number = 10): Promise<string> {
        return await bcrypt.hash(str, salt);
    }

    /**
     * Compares a string with a hash.
     * 
     * @param str String to compare
     * @param hash Hash to compare
     * @returns true if the string matches the hash, false otherwise
     */
    public async compare(str: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(str, hash);
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
    public async encodeToken(data: TokenData, key: string, expiration: number = 3600): Promise<string> {
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
    public async decodeToken(token: string, key: string): Promise<TokenData> {
        return new Promise<TokenData>((resolve, reject) => {
            jwt.verify(token, key, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data as TokenData);
                }
            });
        });
    }

    /**
     * Authenticates an user.
     * 
     * A token must be provided in the request headers `x-access-token`. If the token is valid, it data is stored into `res.locals.tokenData` and the user is stored into
     * `res.locals.user`.
     * 
     * This method is a handler.
     * 
     * @param req Express request
     * @param res Express response
     * @param next Next handler
     * @async
     */
    public async authenticateHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
        const token = req.headers['x-access-token'] as string;

        if (token !== null) {
            try {
                const data = await this.decodeToken(token, process.env.TOKEN_KEY);
                const user = await this.container.db.users.findById(data.userId);

                if (user) {
                    res.locals.tokenData = data;
                    res.locals.user = user;
                }
            } catch (err) {
                console.error(err);
            }
        }

        return next();
    }

    /**
     * Checks if an user is authenticated.
     * 
     * This method is a handler.
     * 
     * @param req Express request
     * @param res Express response
     * @param next Next handler
     */
    public async isAuthenticatedHandler(req: Request, res: Response, next: NextFunction): Promise<any> {
        return res.locals.tokenData ? next() : res.status(401).json({ error: 'Not authenticated' });
    }
}

/**
 * Token data interface.
 */
export interface TokenData {
    userId: string;
}
