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
        return this.container.config.permissions.roles[user.role].permissions.includes(permission);
    }
}

/**
 * Permission type.
 */
export type Permission =
      'user.view.all'
    | 'user.modify'
    | 'user.update'; // TODO Add all permissions in the future
