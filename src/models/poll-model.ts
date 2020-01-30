import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * Poll attributes interface.
 */
export interface PollAttributes extends Attributes {
    title: string;
    // TODO Add author (user model)
    options: {
        multiple: boolean;
        ipChecking: boolean;
    };
    choices: [{
        _id: string;
        label: string;
        voters: [{
            ip: string;
            // TODO Add voter (user model)
        }];
    }];
    // TODO Add comments (comment model)
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
    const schema = new Schema({
        title: {
            type: Schema.Types.String,
            required: true,
            maxlength: 100
        },
        // TODO Add author (user model)
        options: createOptionsSubSchema(),
        choices: createChoicesSubSchema()
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
        voters: createVotersSubSchema()
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
        // TODO Add voter (user model)
    });
    return schema;
}
