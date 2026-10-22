declare module "bun" {
  interface Env {
    PORT: string;
    DB_FILE_NAME: string;
    TRUST_PROXY: string;
    REDIS_URL: string;
  }
}
