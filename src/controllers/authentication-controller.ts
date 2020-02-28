import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import { AccessTokenData, RefreshTokenData } from '../services/token-service';
import Controller, { Link } from './controller';

/**
 * Users controller.
 */
export default class AuthenticationController extends Controller {

    /**
     * Creates a new users controller.
     * 
     * @param container 
     */
    public constructor(container: ServiceContainer) {
        super(container, '/auth');
        this.signUpHandler = this.signUpHandler.bind(this);
        this.signInHandler = this.signInHandler.bind(this);
        this.refreshAccessTokenHandler = this.refreshAccessTokenHandler.bind(this);
        this.registerEndpoint({ method: 'POST', uri: '/signup', handlers: [this.signUpHandler], description: 'Signup / Register' });
        this.registerEndpoint({ method: 'POST', uri: '/signin', handlers: [this.signInHandler], description: 'Signin / Login' });
        this.registerEndpoint({ method: 'POST', uri: '/refreshAccessToken', handlers: [this.refreshAccessTokenHandler], description: 'Refreshes access token' });
    }

    /**
     * Signup / Register.
     * 
     * This method is a handler / endpoint :
     * - Method : `POST`
     * - URI : `/signup`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async signUpHandler(req: Request, res: Response): Promise<any> {
        try {
            const user = await this.container.db.users.create({
                email: req.body.email,
                name: req.body.name,
                password: req.body.password
            });
            return res.status(201).json({
                id: user.id,
                links: [{
                    rel: 'Signin / Login',
                    action: 'POST',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/signin`
                }, {
                    rel: 'Gets the signed up user',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}/users/${user.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Signin / Login.
     * 
     * This method is a handler / endpoint :
     * - Method : `POST`
     * - URI : `/signin`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async signInHandler(req: Request, res: Response): Promise<any> {
        try {
            const user = await this.container.db.users.findOne({ email: req.body.email }, { password: 1 });
            if (!user) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'User not found'
                }));
            }
            if (!await this.container.crypto.compare(req.body.password, user.password)) {
                return res.status(401).json(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Invalid password'
                }));
            }
            const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: user.id }, process.env.ACCESS_TOKEN_KEY, parseInt(process.env.ACCESS_TOKEN_EXP, 10));
            const refreshToken = await this.container.db.refreshTokens.create({
                token: await this.container.tokens.encode<RefreshTokenData>({ userId: user.id }, process.env.REFRESH_TOKEN_KEY, parseInt(process.env.REFRESH_TOKEN_EXP, 10)),
                user
            });
            return res.status(200).json({
                id: user.id,
                access_token: accessToken,
                refresh_token: refreshToken.token,
                links: [{
                    rel: 'Gets the signed in user',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}/users/${user.id}`
                }] as Link[]
            });
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Refreshes access token.
     * 
     * This method is a handler / endpoint :
     * - Method : `POST`
     * - URI : `/refreshAccessToken`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async refreshAccessTokenHandler(req: Request, res: Response): Promise<any> {
        try {
            const refreshToken = await this.container.db.refreshTokens.findOne({ token: req.body.refreshToken }).populate('user');
            if (!refreshToken) {
                return res.status(400).json(this.container.errors.formatErrors({
                    error: 'invalid_request',
                    error_description: 'No refresh token provided'
                }));
            }
            const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: refreshToken.user.id }, process.env.ACCESS_TOKEN_KEY, parseInt(process.env.ACCESS_TOKEN_EXP, 10));
            refreshToken.expiration = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXP, 10) * 1000));
            await refreshToken.save();
            return res.status(200).json({ access_token: accessToken });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }
}
