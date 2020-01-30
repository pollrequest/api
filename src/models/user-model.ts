import { Document, Model, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import Attributes from './model';

/**
 * User attributes interface.
 */
export interface UserAttributes extends Attributes {
    email: string;
    name: string;
    password: string;
    // TODO polls: []
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
            required: [true, 'Email is required'],
            unique: true,
            match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Invalid user email']
        },
        name: {
            type: Schema.Types.String,
            required: [true, 'User name is required'],
            minlength: [3, 'Name is too small, it\'s length must be between 3 and 30 characters'],
            maxlength: [30, 'Name is too long, it\'s length must be between 3 and 30 characters']
        },
        password: {
            type: Schema.Types.String,
            required: [true, 'User password is required'],
            minlength: [8, 'Password is too small, it\'s length must be greater than 8 characters'],
            select: false // Par défaut retourne pas le mot de passe (dans les find)
        }
    }, {
        timestamps: true
    });
    return schema;
}
