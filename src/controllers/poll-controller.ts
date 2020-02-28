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
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: [this.container.auth.authenticateHandler, this.listPollsHandler], description: 'Lists all polls' });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: [this.container.auth.authenticateHandler, this.getPollHandler], description: 'Gets a specific poll' });
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: [this.container.auth.authenticateHandler, this.createPollHandler], description: 'Creates a new poll' });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: [this.container.auth.authenticateHandler, this.modifyPollHandler], description: 'Modifies a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: [this.container.auth.authenticateHandler, this.updatePollHandler], description: 'Updates a poll' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: [this.container.auth.authenticateHandler, this.deletePollHandler], description: 'Deletes a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id/vote', handlers: [this.container.auth.authenticateHandler, this.voteHandler], description: 'Votes for a choice' });

        // Comments
        this.registerEndpoint({ method: 'GET', uri: '/:id/comments', handlers: [this.container.auth.authenticateHandler, this.listCommentsHandler], description: 'Gets all comments' });
        this.registerEndpoint({ method: 'GET', uri: '/:pollId/comments/:commentId', handlers: [this.container.auth.authenticateHandler, this.getCommentHandler], description: 'Gets a specific comment' });
        this.registerEndpoint({ method: 'POST', uri: '/:id/comments', handlers: [this.container.auth.authenticateHandler, this.createCommentHandler], description: 'Creates a new comment' });
        this.registerEndpoint({ method: 'PUT', uri: '/:pollId/comments/:commentId', handlers: [this.container.auth.authenticateHandler, this.modifyCommentHandler], description: 'Modifies a comment' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:pollId/comments/:commentId', handlers: [this.container.auth.authenticateHandler, this.updateCommentHandler], description: 'Updates a comment' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:pollId/comments/:commentId', handlers: [this.container.auth.authenticateHandler, this.deleteCommentHandler], description: 'Deletes a comment' });
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
            const { user: self } = res.locals;
            let polls;
            if (this.container.perms.hasPermission(self, 'poll.list.all')) {
                if (this.container.perms.hasPermission(self, 'user.list.all')) {
                    polls = await this.db.polls.find().populate('author');
                } else {
                    polls = await this.db.polls.find().populate('author', 'name');
                }
            } else {
                if (this.container.perms.hasPermission(self, 'user.list.all')) {
                    polls = await this.db.polls.find().select('title options choices.label comments').populate('author');
                } else {
                    polls = await this.db.polls.find().select('title options choices.label comments').populate('author', 'name');
                }
            }
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
            const { user: self } = res.locals;
            let poll: PollInstance;
            if (this.container.perms.hasPermission(self, 'poll.specific.all')) {
                if (this.container.perms.hasPermission(self, 'user.list.all')) {
                    poll = await this.db.polls.findById(req.params.id).populate('author');
                } else {
                    poll = await this.db.polls.findById(req.params.id).populate('author', 'name');
                }
            } else {
                if (this.container.perms.hasPermission(self, 'user.list.all')) {
                    poll = await this.db.polls.findById(req.params.id).select('title options choices.label comments').populate('author');
                } else {
                    poll = await this.db.polls.findById(req.params.id).select('title options choices.label comments').populate('author', 'name');
                }
            }
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
            const { user: self } = res.locals;
            const poll = await this.container.db.polls.findById(req.params.id).populate('author');
            if (this.container.perms.hasPermission(self, 'poll.modify') || self?.id == poll.author?.id) {
                if (!poll) {
                    return res.status(404).json(this.container.errors.formatErrors({
                        error: 'not_found',
                        error_description: 'Poll not found'
                    }));
                }
                if (this.container.perms.hasPermission(self, 'poll.modify.all')) {
                    poll.title = req.body.title;
                }
                if (this.container.perms.hasPermission(self, 'poll.modify.all')) {
                    poll.author = req.body.author;
                }
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
            } else {
                return res.status(403).send(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Not allowed to modify this poll'
                }));
            }
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
            const { user: self } = res.locals;
            const poll = await this.container.db.polls.findById(req.params.id).populate('author');
            if (this.container.perms.hasPermission(self, 'poll.update') || self?.id == poll.author?.id) {
                if (!poll) {
                    return res.status(404).json(this.container.errors.formatErrors({
                        error: 'not_found',
                        error_description: 'Poll not found'
                    }));
                }
                if (req.body.title && this.container.perms.hasPermission(self, 'poll.update.all')) {
                    poll.title = req.body.title;
                }
                if (req.body.author && this.container.perms.hasPermission(self, 'poll.update.all')) {
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
            } else {
                return res.status(403).send(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Not allowed to update this poll'
                }));
            }
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
            const { user: self } = res.locals;
            if (this.container.perms.hasPermission(self, 'poll.delete')) {
                const poll = await this.container.db.polls.findByIdAndDelete(req.params.id);
                if (!poll) {
                    return res.status(404).json(this.container.errors.formatErrors({
                        error: 'not_found',
                        error_description: 'Poll not found'
                    }));
                }
                return res.status(204).json();
            } else {
                return res.status(403).send(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Not allowed to delete this poll'
                }));
            }
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
            const { user: self } = res.locals;
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
            if (this.container.perms.hasPermission(self, 'poll.comment.modify')) {
                com.author = req.body.author;
            }
            if (this.container.perms.hasPermission(self, 'poll.comment.modify') || self?.id == poll.author?.id) {
                com.content =  req.body.content;
            }
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
            const { user: self } = res.locals;
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
            if (req.body.author && this.container.perms.hasPermission(self, 'poll.comment.update')) {
                com.author = req.body.author;
            }
            if (req.body.content && (this.container.perms.hasPermission(self, 'poll.comment.modify') || self?.id == poll.author?.id)) {
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
            const { user: self } = res.locals;
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (this.container.perms.hasPermission(self, 'poll.comment.delete') || self?.id == poll.author?.id) {
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
            } else {
                return res.status(403).send(this.container.errors.formatErrors({
                    error: 'access_denied',
                    error_description: 'Not allowed to delete this comment'
                }));
            }
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
