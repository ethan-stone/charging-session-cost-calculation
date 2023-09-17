import { drizzle } from "drizzle-orm/planetscale-serverless";
import * as schema from "./schema";
import mysql from "mysql2/promise";

// create the connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
});

export const db = drizzle(connection, { schema });
