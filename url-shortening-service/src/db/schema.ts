import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const urls = sqliteTable("urls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shortCode: text("short_code").notNull().unique(),
  url: text("url").notNull(),
  visitCount: integer("visit_count").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
