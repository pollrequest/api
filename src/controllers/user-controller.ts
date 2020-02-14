import { Request, Response } from 'express';
import { UserInstance } from '../models/user-model';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

/**
 * Users controller.
 */
export default class UserController extends Controller {

    /**
     * Creates a new users controller.
     * 
     * @param container 
     */
    public constructor(container: ServiceContainer) {
        super(container, '/users');
        this.getMeHandler = this.getMeHandler.bind(this);
        this.getAllHandler = this.getAllHandler.bind(this);
        this.getSpecificHandler = this.getSpecificHandler.bind(this);
        this.modifyHandler = this.modifyHandler.bind(this);
        this.updateHandler = this.updateHandler.bind(this);
        this.deleteHandler = this.deleteHandler.bind(this);
        this.registerEndpoint({ method: 'GET', uri: '/me', handlers: [this.container.auth.authenticateHandler, this.getMeHandler], description: 'Gets the user from a provided token' });
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: [this.getAllHandler], description: 'Gets all users' });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: [this.getSpecificHandler], description: 'Gets a specific user' });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: [this.modifyHandler], description: 'Modifies an user' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: [this.updateHandler], description: 'Updates an user' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: [this.deleteHandler], description: 'Deletes an user' });
    }

    /**
     * Gets the user from a provided token (in headers or body).
     * 
     * This method is a handler / endpoint :
     * - Method : `GET`
     * - URI : `/me`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getMeHandler(req: Request, res: Response): Promise<any> {
        try {
            let user: UserInstance | null = null;
            if (res.locals.user) { // First check : headers
                user = res.locals.user;
            } else if (req.body.token) { // If not in headers, second check : body
                const tokenData = await this.container.tokens.decode(req.body.token, process.env.ACCESS_TOKEN_KEY);
                user = await this.container.db.users.findById(tokenData.userId);
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets all users.
     * 
     * This method is a handler / endpoint :
     * - Method : `GET`
     * - URI : `/`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getAllHandler(req: Request, res: Response): Promise<any> {
        try {
            const users = await this.container.db.users.find();
            return res.status(200).json(users);
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific user.
     * 
     * This method is a handler / endpoint :
     * - Method : `GET`
     * - URI : `/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async getSpecificHandler(req: Request, res: Response): Promise<any> {
        try {
            const user = await this.container.db.users.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Modifies an user.
     * 
     * This method is a handler / endoint :
     * - Method : `PUT`
     * - URI : `/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async modifyHandler(req: Request, res: Response): Promise<any> {
        try {
            const user = await this.container.db.users.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            user.email = req.body.email;
            user.name = req.body.name;
            user.password = req.body.password;
            await user.save();
            return res.status(200).json({
                links: [{
                    rel: 'Gets the modified user',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${user.id}`
                }],
                id: user.id
            });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Updates an user.
     * 
     * This method is a handler / endoint :
     * - Method : `PATCH`
     * - URI : `/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async updateHandler(req: Request, res: Response): Promise<any> {
        try {
            const user = await this.container.db.users.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (req.body.email) {
                user.email = req.body.email;
            }
            if (req.body.name) {
                user.name = req.body.name;
            }
            if (req.body.password) {
                user.password = req.body.password;
            }
            await user.save();
            return res.status(200).json({
                links: [{
                    rel: 'Gets the updated user',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${user.id}`
                }],
                id: user.id
            });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Deletes an user.
     * 
     * This method is a handler / endpoint :
     * - Method : `DELETE`
     * - URI : `/:id`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async deleteHandler(req: Request, res: Response): Promise<any> {
        try {
            const user = await this.container.db.users.findByIdAndDelete(req.params.id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(204).json();
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }
}
