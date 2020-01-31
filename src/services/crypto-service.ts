import bcrypt from 'bcryptjs';
import Service from './service';
import ServiceContainer from './service-container';

/**
 * Crypto service class.
 * 
 * This service is used to encrypt data.
 */
export default class CryptoService extends Service {

    /**
     * Creates a new crypto service.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container);
    }

    /**
     * Hashes a string.
     * 
     * @param str String to hash
     * @param salt Salt for hash
     * @returns Hashed string
     * @async
     */
    public async hash(str: string, salt: number = 10): Promise<string> {
        return await bcrypt.hash(str, salt);
    }

    /**
     * Compares a string with a hash.
     * 
     * @param str String to compare
     * @param hash Hash to compare
     * @returns true if the string matches the hash, false otherwise
     */
    public async compare(str: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(str, hash);
    }
}
