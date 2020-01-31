declare namespace NodeJS {

    export interface ProcessEnv {
        API_PORT: string;
        DB_HOST: string;
        DB_PORT: string;
        DB_NAME: string;
        TOKEN_KEY: string;
        TOKEN_EXP: string;
        REFRESH_TOKEN_EXPIRATION: string;
        HASH_SALT: string;
    }
}
