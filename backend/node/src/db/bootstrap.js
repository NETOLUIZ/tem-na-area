import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { pool } from "./pool.js";

let bootstrapped = false;

export async function ensureDatabase() {
  if (bootstrapped || !env.bootstrapDatabase) {
    return;
  }

  const [rows] = await pool.query("SELECT to_regclass('public.planos') AS planos");
  if (rows[0]?.planos) {
    bootstrapped = true;
    return;
  }

  const schemaPath = path.resolve(process.cwd(), "..", "database", "tem_na_area_postgres.sql");
  const sql = await fs.readFile(schemaPath, "utf8");
  await pool.pool.query(sql);
  bootstrapped = true;
}
