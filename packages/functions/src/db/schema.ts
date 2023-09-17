import { index, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const clients = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      createdAt: index("created_at_idx").on(table.createdAt),
      updatedAt: index("updated_at_idx").on(table.updatedAt),
    };
  }
);
