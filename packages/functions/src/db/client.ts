import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import mysql from "mysql2/promise";

// create the connection
const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "charging_session_cost_calculation",
});

export const db = drizzle(connection, { schema, mode: "default" });
