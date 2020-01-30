import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';
import { PollInstance } from './poll-model';

/**
 * User attributes interface.
 */
export interface UserAttributes extends Attributes {
    email: string;
    name: string;
    password: string;
    polls: PollInstance[];
}

/**
 * User instance interface.
 */
export interface UserInstance extends UserAttributes, Document {}

/**
 * Creates the user model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 * @returns User model
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose): Model<UserInstance> {
    return mongoose.model('User', createSchema(container), 'users');
}

/**
 * Creates the user schema.
 * 
 * @param container Services container
 * @returns User schema
 */
function createSchema(container: ServiceContainer) {
    const schema = new Schema({
        email: {
            type: Schema.Types.String,
            required: true,
            unique: true,
            match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        },
        name: {
            type: Schema.Types.String,
            required: true,
            minlength: 3,
            maxlength: 30
        },
        password: {
            type: Schema.Types.String,
            required: true,
            minlength: 8,
            select: false // Par défaut retourne pas le mot de passe (dans les find)
        },
        polls: [{
            type: Schema.Types.ObjectId,
            ref: 'Poll',
            default: []
        }]
    }, {
        timestamps: true
    });

    // Password hash validation
    schema.pre('validate', async function(this: UserInstance, next) {
        if (this.password !== undefined) { // Validates the password only if filled
            try {
                this.password = await container.auth.hash(this.password, Number(process.env.HASH_SALT));
                return next();
            } catch (err) {
                container.log.log(err, { severity: 'ERROR' });
                return next(err);
            }
        }
    });

    return schema;
}
