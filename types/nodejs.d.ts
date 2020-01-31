declare namespace NodeJS {

    export interface ProcessEnv {
        API_PORT: string;
        DB_HOST: string;
        DB_PORT: string;
        DB_NAME: string;
        ACCESS_TOKEN_KEY: string;
        ACCESS_TOKEN_EXP: string;
        REFRESH_TOKEN_KEY: string;
        REFRESH_TOKEN_EXP: string;
        HASH_SALT: string;
    }
}
