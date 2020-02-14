import { NextFunction, Request, Response } from 'express';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Authentication service class.
 * 
 * This service is used to manage authentication for users.
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

        if (token != null) {
            try {
                const data = await this.container.tokens.decode(token, process.env.ACCESS_TOKEN_KEY);
                const user = await this.container.db.users.findById(data.userId);

                if (user) {
                    res.locals.tokenData = data;
                    res.locals.user = user;
                }
            } catch (err) {
                this.container.log.error(err);
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
        return res.locals.tokenData ? next() : res.status(401).json(this.container.errors.formatErrors({
            error: 'access_denied',
            error_description: 'Not authenticated'
        }));
    }
}
