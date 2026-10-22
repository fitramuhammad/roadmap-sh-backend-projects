import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

export function createDb(filename: string) {
  const sqlite = new Database(filename);

  sqlite.run("PRAGMA journal_mode = WAL;");
  sqlite.run("PRAGMA busy_timeout = 5000;");

  const db = drizzle({ client: sqlite });

  return { db, sqlite };
}

export type Db = ReturnType<typeof createDb>["db"];
