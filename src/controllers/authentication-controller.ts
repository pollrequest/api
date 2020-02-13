import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import { AccessTokenData, RefreshTokenData } from '../services/token-service';
import Controller from './controller';

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
                links: [{
                    rel: 'login',
                    href: `${req.protocol}://${req.hostname}/auth/signin`
                }],
                id: user.id
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
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
                return res.status(404).json({ error: 'User not found' });
            }
            if (!await this.container.crypto.compare(req.body.password, user.password)) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: user.id }, process.env.ACCESS_TOKEN_KEY, parseInt(process.env.ACCESS_TOKEN_EXP, 10));
            const refreshToken = await this.container.db.refreshTokens.create({
                token: await this.container.tokens.encode<RefreshTokenData>({ userId: user.id }, process.env.REFRESH_TOKEN_KEY, parseInt(process.env.REFRESH_TOKEN_EXP, 10)),
                user
            });
            return res.status(200).json({
                id: user.id,
                accessToken,
                refreshToken: refreshToken.token
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
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
                return res.status(400).json({ error: 'No refresh token provided' });
            }
            const accessToken = await this.container.tokens.encode<AccessTokenData>({ userId: refreshToken.user.id }, process.env.ACCESS_TOKEN_KEY, parseInt(process.env.ACCESS_TOKEN_EXP, 10));
            refreshToken.expiration = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXP, 10) * 1000));
            await refreshToken.save();
            return res.status(200).json({ accessToken });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json(err);
        }
    }
}
