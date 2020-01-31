import { Document, Mongoose, Schema } from 'mongoose';
import ServiceContainer from '../services/service-container';
import { UserInstance } from './user-model';

/**
 * Refresh token attributes interface.
 */
export interface RefreshTokenAttributes {
    token: string;
    expiration: Date;
    user: UserInstance;
}

/**
 * Refresh token instance interface.
 */
export interface RefreshTokenInstance extends RefreshTokenAttributes, Document {}

/**
 * Creates the refresh token model.
 * 
 * @param container Services container
 * @param mongoose Mongoose instance
 */
export default function createModel(container: ServiceContainer, mongoose: Mongoose) {
    return mongoose.model<RefreshTokenInstance>('RefreshToken', createSchema(), 'refreshTokens');
}

/**
 * Creates refresh token schema.
 * 
 * @returns Refresh token schema
 */
function createSchema() {
    const schema = new Schema({
        token: {
            type: Schema.Types.String,
            required: true
        },
        expiration: {
            type: Schema.Types.Date,
            default: new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXP, 10) * 1000))
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    });
    return schema;
}
