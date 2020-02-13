import { Request, Response } from 'express';
import ServiceContainer from '../services/service-container';
import { AccessTokenData, RefreshTokenData } from '../services/token-service';
import Controller from './controller';
import { PollInstance } from '../models/poll-model';
import { UserInstance } from '../models/user-model';

/**
 * Users controller.
 */
export default class PollController extends Controller {

    /**
     * Creates a new users controller.
     * 
     * @param container 
     */
    public constructor(container: ServiceContainer) {
        super(container, '/polls');
        this.addPollHandler = this.addPollHandler.bind(this);
        this.deletePollHandler = this.deletePollHandler.bind(this);
        this.getPollHandler = this.getPollHandler.bind(this);
        this.listPollsHandler = this.listPollsHandler.bind(this);
        this.modifyPollHandler = this.modifyPollHandler.bind(this);
        this.updatePollHandler = this.updatePollHandler.bind(this);
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: [this.container.auth.authenticateHandler, this.addPollHandler], description: 'Add a poll' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: [this.deletePollHandler], description: 'Deletes a poll' });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: [this.getPollHandler], description: 'Get a poll' });
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: [this.listPollsHandler], description: 'List all polls' });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: [this.modifyPollHandler], description: 'Modify a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: [this.updatePollHandler], description: 'Update a poll' });
    }

    /**
     * Add a poll.
     * 
     * This method is a handler / endoint :
     * - Method : `POST`
     * - URI : `/`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async addPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.create({
                title: req.body.title,
                author: res.locals.user || null,
                options: req.body.options,
                choices: req.body.choices
            });
            return res.status(201).json({
                links: [{
                    rel: 'gets the created poll',
                    href: `${req.protocol}://${req.hostname}/polls/${poll.id}`
                }],
                id: poll.id
            });
        } catch (err) {
            this.logger.error(err, {type: 'endpoints'});
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Delete a poll.
     * 
     * This method is a handler / endoint :
     * - Method : `DELETE`
     * - URI : `/:id`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async deletePollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findByIdAndDelete(req.params.id);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            return res.status(204).json();
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Get a poll.
     * 
     * This method is a handler / endoint :
     * - Method : `GET`
     * - URI : `/:id`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async getPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            return res.status(200).json(poll);
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * List all polls.
     * 
     * This method is a handler / endoint :
     * - Method : `GET`
     * - URI : `/`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async listPollsHandler(req: Request, res: Response): Promise<any> {
        try {
            const polls = await this.container.db.polls.find();
            return res.status(200).json(polls);
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Modifies a poll.
     * 
     * This method is a handler / endoint :
     * - Method : `PUT`
     * - URI : `/:id`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async modifyPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            poll.title = req.body.title;
            poll.author = req.body.author;
            poll.options = req.body.options;
            await poll.save();
            return res.status(200).json({
                links: [{
                    rel: 'gets the poll',
                    href: `${req.protocol}://${req.hostname}/polls/${poll.id}`
                }],
                id: poll.id
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Updates a poll.
     * 
     * This method is a handler / endoint :
     * - Method : `PATCH`
     * - URI : `/:id`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async updatePollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            if (req.body.title) {
                poll.title = req.body.title;
            }
            if (req.body.author) {
                poll.author = req.body.author;
            }
            if (req.body.options) {
                poll.options = req.body.options;
            }
            await poll.save();
            return res.status(200).json({
                links: [{
                    rel: 'gets the poll',
                    href: `${req.protocol}://${req.hostname}/polls/${poll.id}`
                }],
                id: poll.id
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }
}