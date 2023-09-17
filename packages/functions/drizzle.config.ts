import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    connectionString:
      "mysql://root:password@127.0.0.1:3306/charging_session_cost_calculation",
  },
  driver: "mysql2",
} satisfies Config;
