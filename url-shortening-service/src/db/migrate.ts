import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import type { Db } from "./index";

export function runMigrations(db: Db) {
  migrate(db, { migrationsFolder: "./drizzle" });
}
