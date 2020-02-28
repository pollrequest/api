import { Request, Response } from 'express';
import _ from 'lodash';
import { PollInstance } from '../models/poll-model';
import ServiceContainer from '../services/service-container';
import Controller, { Link } from './controller';

/**
 * Polls controller.
 */
export default class PollController extends Controller {

    /**
     * Creates a new polls controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/polls');

        // Polls
        this.createPollHandler = this.createPollHandler.bind(this);
        this.deletePollHandler = this.deletePollHandler.bind(this);
        this.getPollHandler = this.getPollHandler.bind(this);
        this.listPollsHandler = this.listPollsHandler.bind(this);
        this.modifyPollHandler = this.modifyPollHandler.bind(this);
        this.updatePollHandler = this.updatePollHandler.bind(this);

        // Comments
        this.createCommentHandler = this.createCommentHandler.bind(this);
        this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
        this.getCommentHandler = this.getCommentHandler.bind(this);
        this.listCommentsHandler = this.listCommentsHandler.bind(this);
        this.modifyCommentHandler = this.modifyCommentHandler.bind(this);
        this.updateCommentHandler = this.updateCommentHandler.bind(this);
        this.voteHandler = this.voteHandler.bind(this);

        // Polls
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: [this.listPollsHandler], description: 'Lists all polls' });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: [this.getPollHandler], description: 'Gets a specific poll' });
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: [this.container.auth.authenticateHandler, this.createPollHandler], description: 'Creates a new poll' });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: [this.modifyPollHandler], description: 'Modifies a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: [this.updatePollHandler], description: 'Updates a poll' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: [this.deletePollHandler], description: 'Deletes a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id/vote', handlers: [this.container.auth.authenticateHandler, this.voteHandler], description: 'Votes for a choice' });

        // Comments
        this.registerEndpoint({ method: 'GET', uri: '/:id/comments', handlers: [this.listCommentsHandler], description: 'Gets all comments' });
        this.registerEndpoint({ method: 'GET', uri: '/:pollId/comments/:commentId', handlers: [this.getCommentHandler], description: 'Gets a specific comment' });
        this.registerEndpoint({ method: 'POST', uri: '/:id/comments', handlers: [this.container.auth.authenticateHandler, this.createCommentHandler], description: 'Creates a new comment' });
        this.registerEndpoint({ method: 'PUT', uri: '/:pollId/comments/:commentId', handlers: [this.modifyCommentHandler], description: 'Modifies a comment' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:pollId/comments/:commentId', handlers: [this.updateCommentHandler], description: 'Updates a comment' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:pollId/comments/:commentId', handlers: [this.deleteCommentHandler], description: 'Deletes a comment' });
    }

    /**
     * Lists all polls.
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
            const polls = await this.container.db.polls.find().populate('author');
            return res.status(200).json({ polls });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific poll.
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
            const poll = await this.container.db.polls.findById(req.params.id).populate('author');
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            return res.status(200).json({
                poll,
                links: [{
                    rel: 'Modifies the poll',
                    action: 'PUT',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
                }, {
                    rel: 'Updates the poll',
                    action: 'PATCH',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
                }, , {
                    rel: 'Adds a vote',
                    action: 'PATCH',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}/vote`
                }] as Link[]
            });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new poll.
     * 
     * This method is a handler / endoint :
     * - Method : `POST`
     * - URI : `/`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async createPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.create({
                title: req.body.title,
                author: res.locals.user || null,
                options: req.body.options,
                choices: req.body.choices?.map((choiceLabel: string) => {
                    return { label: choiceLabel };
                })
            });
            return res.status(201).json({
                id: poll.id,
                links: [{
                    rel: 'Gets the created poll',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
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
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            poll.title = req.body.title;
            poll.author = req.body.author;
            poll.options = req.body.options;
            await poll.save();
            return res.status(200).json({
                id: poll.id,
                links: [{
                    rel: 'Gets the modified poll',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
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
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
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
                id: poll.id,
                links: [{
                    rel: 'Gets the updated poll',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
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
     * Deletes a poll.
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
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            return res.status(204).json();
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Votes for a choice.
     * 
     * This method is a handler / endoint :
     * - Method : `PATCH`
     * - URI : `/:id/vote`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async voteHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            if (req.body.choices == null || req.body.choices.length === 0) {
                return res.status(400).json(this.container.errors.formatErrors({
                    error: 'invalid_request',
                    error_description: 'choices are required'
                }));
            }
            const selectedChoices = [];
            for await (const selectedChoice of req.body?.choices) {
                const choice = poll.choices.find(currentChoice => currentChoice._id == selectedChoice);
                if (choice == null) {
                    return res.status(404).json(this.container.errors.formatErrors({
                        error: 'not_found',
                        error_description: `Choice ${selectedChoice} not found`
                    }));
                }
                selectedChoices.push(choice);
            }
            if (!poll.options.multiple && selectedChoices.length > 1) { // Multiple checking
                return res.status(403).json(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Multiple choices are not permitted'
                }));
            }
            if (poll.options.ipChecking && await this.ipExists(poll, req.ip)) { // IP checking
                return res.status(403).json(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Already voted'
                }));
            }
            for await (const choice of selectedChoices) {
                choice.voters.push({
                    ip: req.ip,
                    voter: res.locals.user || null
                });
            }
            await poll.save();
            return res.status(200).json({
                links: [{
                    rel: 'Gets the voted poll',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
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
     * Lists all comments.
     * 
     * This method is a handler / endpoint : 
     * - Method : `GET`
     * - URI : `/:id/comments`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async listCommentsHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            return res.status(201).json({ comments: poll.comments });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Gets a specific comment.
     * 
     * This method is a handler / endpoint : 
     * - Method : `GET`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async getCommentHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Comment not found'
                }));
            }
            return res.status(200).json({
                com,
                links: [{
                    rel: 'Modifies the comment',
                    action: 'PUT',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}/comments/${com._id}`
                }, {
                    rel: 'Updates the comment',
                    action: 'PATCH',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}/comments/${com._id}`
                }] as Link[]
            });
        } catch (err) {
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Creates a new comment.
     * 
     * This method is a handler / endpoint : 
     * - Method : `POST`
     * - URI : `/:id/comments`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async createCommentHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            poll.comments.push({
                author: req.body.author,
                content: req.body.content
            });
            const comment = poll.comments[poll.comments.length - 1];
            await poll.save();
            return res.status(201).json({
                id: comment._id,
                links: [{
                    rel: 'Gets the created comment',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}/comments/${comment._id}`
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
     * Modifies a comment.
     * 
     * This method is a handler / endpoint : 
     * - Method : `PUT`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async modifyCommentHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Comment not found'
                }));
            }
            com.author = req.body.author;
            com.content =  req.body.content;
            await poll.save();
            return res.status(200).json({
                id: com._id,
                links: [{
                    rel: 'Gets the modified comment',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}/comments/${com._id}`
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
     * Updates a comment.
     * 
     * This method is a handler / endpoint : 
     * - Method : `PATCH`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async updateCommentHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Comment not found'
                }));
            }
            if (req.body.author) {
                com.author = req.body.author;
            }
            if (req.body.content) {
                com.content =  req.body.content;
            }
            await poll.save();
            return res.status(200).json({
                id: com._id,
                links: [{
                    rel: 'Gets the updated comment',
                    action: 'GET',
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}/comments/${com._id}`
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
     * Deletes a comment.
     * 
     * This method is a handler / endpoint : 
     * - Method : `DELETE`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req Express Request
     * @param res Express Response
     * @async
     */
    public async deleteCommentHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Poll not found'
                }));
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json(this.container.errors.formatErrors({
                    error: 'not_found',
                    error_description: 'Comment not found'
                }));
            }
            _.remove(poll.comments, comment => comment._id == req.params.commentId);
            poll.markModified('comments');
            await poll.save();
            return res.status(204).json();
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).send(this.container.errors.formatErrors(...this.container.errors.translateMongooseValidationError(err)));
            }
            return res.status(500).json(this.container.errors.formatServerError());
        }
    }

    /**
     * Checks if an IP exists on a poll voters.
     * 
     * This method checks voters in all choices for a poll.
     * 
     * @param poll Target poll
     * @param ip IP to check
     */
    private async ipExists(poll: PollInstance, ip: string): Promise<boolean> {
        for await (const choice of poll.choices) {
            for await (const voter of choice.voters) {
                if (voter.ip === ip) {
                    return true;
                }
            }
        }
        return false;
    }
}
