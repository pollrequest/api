import { UserInstance } from '../models/user-model';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Permissions service class.
 * 
 * This service is used to check if an user or a role has a permission.
 */
export default class PermissionService extends Service {

    /**
     * Creates a new permissions service.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container);
    }

    /**
     * Checks if an user has the specified permission.
     * 
     * @param user User
     * @param permission Permission to check
     */
    public hasPermission(user: UserInstance, permission: Permission): boolean {
        return user != null && this.container.config.permissions.roles[user.role].permissions.includes(permission);
    }
}

/**
 * Permission type.
 */
export type Permission =
      'user.list.all' // Access to all user attributes in GET /users
    | 'user.specific.all' // Access to all user attributes in GET /users/:id
    | 'user.modify' // Access to user modification
    | 'user.update' // Access to user update
    | 'user.delete' // Access to user deletion
    | 'poll.list.all' // Access to all poll attributes in GET /polls
    | 'poll.specific.all' // Access to all poll attributes in GET /polls/:id
    | 'poll.modify' // Access to poll modification
    | 'poll.modify.all' // Access to full poll modification
    | 'poll.update' // Access to poll update
    | 'poll.update.all' // Access to full poll update
    | 'poll.delete' // Access to poll deletion
    | 'poll.comment.modify' // Access to poll comment modification
    | 'poll.comment.update' // Access to poll comment update
    | 'poll.comment.delete'; // Access to poll comment deletion
