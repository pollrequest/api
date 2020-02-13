import { Document, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import { UserInstance } from './user-model';

/**
 * Poll attributes interface.
 */
export interface PollAttributes extends Attributes {
    title: string;
    author: UserInstance;
    options: {
        multiple: boolean;
        ipChecking: boolean;
    };
    choices: [{
        _id: string;
        label: string;
        voters: [{
            ip: string;
            voter: UserInstance;
        }];
    }];
    comments: [{
        _id: string;
        author: UserInstance;
        content: string;
    }];
}

/**
 * Poll instance.
 */
export interface PollInstance extends PollAttributes, Document {}

/**
 * Creates the poll model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose) {
    return mongoose.model<PollInstance>('Poll', createPollSchema(), 'polls');
}

/**
 * Creates poll schema.
 * 
 * @returns Poll schema
 */
function createPollSchema() {
    const optionsSubSchema = createOptionsSubSchema();
    const schema = new Schema({
        title: {
            type: Schema.Types.String,
            required: true,
            maxlength: 100
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        options: {
            type: optionsSubSchema,
            default: optionsSubSchema
        },
        choices: [{
            type: createChoicesSubSchema(),
            required: true
        }],
        comments: [{
            type: createCommentsSubSchema()
        }]
    });
    return schema;
}

/**
 * Creates options subschema.
 * 
 * @returns Options subschema
 */
function createOptionsSubSchema() {
    const schema = new Schema({
        multiple: {
            type: Schema.Types.Boolean,
            default: false
        },
        ipChecking: {
            type: Schema.Types.Boolean,
            default: false
        }
    }, {
        _id: false
    });
    return schema;
}

/**
 * Creates choices subschema.
 * 
 * @returns Choices subschema
 */
function createChoicesSubSchema() {
    const schema = new Schema({
        label: {
            type: Schema.Types.String,
            required: true,
            maxlength: 50
        },
        voters: [{
            type: createVotersSubSchema()
        }]
    });
    return schema;
}

/**
 * Creates voters subschema.
 * 
 * @returns Voters subschema
 */
function createVotersSubSchema() {
    const schema = new Schema({
        ip: {
            type: Schema.Types.String,
            required: true
        },
        voter: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
    });
    return schema;
}

/**
 * Creates comments subschema.
 * 
 * @returns Comment schema
 */
function createCommentsSubSchema() {
    const schema = new Schema({
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
