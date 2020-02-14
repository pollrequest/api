import { Request, Response } from 'express';
import _ from 'lodash';
import { PollInstance } from '../models/poll-model';
import ServiceContainer from '../services/service-container';
import Controller from './controller';

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

        // Polls
        this.addPollHandler = this.addPollHandler.bind(this);
        this.deletePollHandler = this.deletePollHandler.bind(this);
        this.getPollHandler = this.getPollHandler.bind(this);
        this.listPollsHandler = this.listPollsHandler.bind(this);
        this.modifyPollHandler = this.modifyPollHandler.bind(this);
        this.updatePollHandler = this.updatePollHandler.bind(this);

        // Comments
        this.addCommentPollHandler = this.addCommentPollHandler.bind(this);
        this.deleteCommentPollHandler = this.deleteCommentPollHandler.bind(this);
        this.getCommentPollHandler = this.getCommentPollHandler.bind(this);
        this.listCommentsPollHandler = this.listCommentsPollHandler.bind(this);
        this.modifyCommentPollHandler = this.modifyCommentPollHandler.bind(this);
        this.updateCommentPollHandler = this.updateCommentPollHandler.bind(this);
        this.voteHandler = this.voteHandler.bind(this);

        // Polls
        this.registerEndpoint({ method: 'POST', uri: '/', handlers: [this.container.auth.authenticateHandler, this.addPollHandler], description: 'Add a poll' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:id', handlers: [this.deletePollHandler], description: 'Deletes a poll' });
        this.registerEndpoint({ method: 'GET', uri: '/:id', handlers: [this.getPollHandler], description: 'Get a poll' });
        this.registerEndpoint({ method: 'GET', uri: '/', handlers: [this.listPollsHandler], description: 'List all polls' });
        this.registerEndpoint({ method: 'PUT', uri: '/:id', handlers: [this.modifyPollHandler], description: 'Modify a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id', handlers: [this.updatePollHandler], description: 'Update a poll' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:id/vote', handlers: [this.container.auth.authenticateHandler, this.voteHandler], description: 'Votes for a choice' });

        // Comments
        this.registerEndpoint({ method: 'POST', uri: '/:id/comments', handlers: [this.container.auth.authenticateHandler, this.addCommentPollHandler], description: 'Add a comment to a poll' });
        this.registerEndpoint({ method: 'DELETE', uri: '/:pollId/comments/:commentId', handlers: [this.deleteCommentPollHandler], description: 'Delete a comment' });
        this.registerEndpoint({ method: 'GET', uri: '/:pollId/comments/:commentId', handlers: [this.getCommentPollHandler], description: 'Get a comment' });
        this.registerEndpoint({ method: 'GET', uri: '/:id/comments', handlers: [this.listCommentsPollHandler], description: 'List all comments' });
        this.registerEndpoint({ method: 'PUT', uri: '/:pollId/comments/:commentId', handlers: [this.modifyCommentPollHandler], description: 'Modify a comment' });
        this.registerEndpoint({ method: 'PATCH', uri: '/:pollId/comments/:commentId', handlers: [this.updateCommentPollHandler], description: 'Update a comment' });
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
                choices: req.body.choices?.map((choiceLabel: string) => {
                    return { label: choiceLabel };
                })
            });
            return res.status(201).json({
                links: [{
                    rel: 'gets the created poll',
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
            const poll = await this.container.db.polls.findById(req.params.id).populate('author');
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
            const polls = await this.container.db.polls.find().populate('author');
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

    /**
     * Add a comment to a poll
     * 
     * This method is a handler / endpoint : 
     * - Method : `POST`
     * - URI : `/:id/comments`
     * 
     * @param req 
     * @param res 
     */
    public async addCommentPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            poll.comments.push({
                author: req.body.author,
                content: req.body.content
            });
            await poll.save();
            return res.status(201).json({
                links: [{
                    rel: 'gets the created comment',
                    href: `${req.protocol}://${req.hostname}/polls/${poll.id}/comments/${poll.comments[poll.comments.length - 1]._id}`
                }],
                id: poll.comments[poll.comments.length - 1]._id
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Delete a comment to a poll
     * 
     * This method is a handler / endpoint : 
     * - Method : `DELETE`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req 
     * @param res 
     */
    public async deleteCommentPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json({ error: 'Comment not found' });
            }
            _.remove(poll.comments, comment => comment._id == req.params.commentId);
            poll.markModified('comments');
            await poll.save();
            return res.status(204).json();
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Get a comment
     * 
     * This method is a handler / endpoint : 
     * - Method : `GET`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req 
     * @param res 
     */
    public async getCommentPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json({ error: 'Comment not found' });
            }
            return res.status(201).json(com);
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * List all comments
     * 
     * This method is a handler / endpoint : 
     * - Method : `GET`
     * - URI : `/:id/comments`
     * 
     * @param req 
     * @param res 
     */
    public async listCommentsPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.id);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            return res.status(201).json(poll.comments);
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Modify a comment
     * 
     * This method is a handler / endpoint : 
     * - Method : `PUT`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req 
     * @param res 
     */
    public async modifyCommentPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json({ error: 'Comment not found' });
            }
            com.author = req.body.author;
            com.content =  req.body.content;
            await poll.save();
            return res.status(200).json({
                links: [{
                    rel: 'gets the comments',
                    href: `${req.protocol}://${req.hostname}/polls/${poll.id}/comments/${com._id}`
                }],
                id: com._id
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
        }
    }

    /**
     * Update a comment
     * 
     * This method is a handler / endpoint : 
     * - Method : `PATCH`
     * - URI : `/:pollId/comments/:commentId`
     * 
     * @param req 
     * @param res 
     */
    public async updateCommentPollHandler(req: Request, res: Response): Promise<any> {
        try {
            const poll = await this.container.db.polls.findById(req.params.pollId);
            if (!poll) {
                return res.status(404).json({ error: 'Poll not found' });
            }
            const com = poll.comments.find(comment => comment._id == req.params.commentId);
            if (!com) {
                return res.status(404).json({ error: 'Comment not found' });
            }
            if (req.body.author) {
                com.author = req.body.author;
            }
            if (req.body.content) {
                com.content =  req.body.content;
            }
            await poll.save();
            return res.status(200).json({
                links: [{
                    rel: 'gets the comments',
                    href: `${req.protocol}://${req.hostname}/polls/${poll.id}/comments/${com._id}`
                }],
                id: com._id
            });
        } catch (err) {
            this.logger.error(err, { type: 'endpoints' });
            return res.status(500).json({ error: err.message });
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
                return res.status(404).json({ error: 'Poll not found' });
            }
            if (req.body.choices == null || req.body.choices.length === 0) {
                return res.status(400).json({ error: 'choices are required' });
            }
            const selectedChoices = [];
            for await (const selectedChoice of req.body?.choices) {
                const choice = poll.choices.find(currentChoice => currentChoice._id == selectedChoice);
                if (choice == null) {
                    return res.status(404).json({ error: `Choice ${selectedChoice} not found` });
                }
                selectedChoices.push(choice);
            }
            if (!poll.options.multiple && selectedChoices.length > 1) { // Multiple checking
                return res.status(403).json({ error: 'Multiple choices are not permitted' });
            }
            if (poll.options.ipChecking && await this.ipExists(poll, req.ip)) { // IP checking
                return res.status(403).json({ error: 'Already voted' });
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
                    href: `${req.protocol}://${req.hostname}${this.rootUri}/${poll.id}`
                }]
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
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
