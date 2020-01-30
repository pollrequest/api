import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import { PollInstance } from './poll-model';
import { UserInstance } from './user-model';

/**
 * Comment attributes interface.
 */
export interface CommentAttributes extends Attributes {
    author: UserInstance;
    poll: PollInstance;
    content: string;
}

/**
 * Comment instance interface.
 */
export interface CommentInstance extends CommentAttributes, Document {}

/**
 * Creates the comment model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 * @returns Comment model
 */
export default function createComment(container: ServiceContainer, mongoose: Mongoose): Model<CommentInstance> {
    return mongoose.model('Comment', createSchema(container), 'comments');
}

/**
 * Creates the comment schema.
 * 
 * @param container Services container
 * @returns Comment schema
 */
function createSchema(container: ServiceContainer) {
    const schema = new Schema({
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        poll: {
            type: Schema.Types.ObjectId,
            ref: 'Poll',
            required: true
        },
        content: {
            type: Schema.Types.String,
            required: true,
            maxlength: 300
        }
    }, {
        timestamps: true
    });

    return schema;
}
