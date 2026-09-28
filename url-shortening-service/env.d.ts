declare module "bun" {
  interface Env {
    PORT: string;
    DB_FILE_NAME: string;
  }
}
