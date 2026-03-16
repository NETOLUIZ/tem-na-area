import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

function createPoolConfig() {
  if (!env.databaseUrl) {
    return {
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPass
    };
  }

  const url = new URL(env.databaseUrl);
  const sslMode = env.dbSslMode || url.searchParams.get("sslmode");

  // The Supabase pooler commonly presents a chain that Node/pg rejects by default.
  if (sslMode) {
    url.searchParams.delete("sslmode");
  }

  const config = {
    connectionString: url.toString()
  };

  if (sslMode && sslMode !== "disable") {
    config.ssl = {
      rejectUnauthorized: env.dbSslRejectUnauthorized
    };
  }

  return config;
}

function toPgSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function normalizeResult(result) {
  const rows = result.rows || [];
  return [rows, { rowCount: result.rowCount || 0, insertId: rows[0]?.id ?? null }];
}

function withInsertReturning(sql) {
  const normalized = sql.trim().replace(/;+\s*$/g, "");
  if (!/^insert\s+/i.test(normalized) || /\breturning\b/i.test(normalized)) {
    return normalized;
  }

  return `${normalized} RETURNING id`;
}

function wrapExecutor(executor) {
  return {
    async query(sql, params = []) {
      const result = await executor.query(sql, params);
      return normalizeResult(result);
    },
    async execute(sql, params = []) {
      const querySql = withInsertReturning(toPgSql(sql));
      const result = await executor.query(querySql, params);
      return normalizeResult(result);
    }
  };
}

class PgConnection {
  constructor(client) {
    this.client = client;
    Object.assign(this, wrapExecutor(client));
  }

  async beginTransaction() {
    await this.client.query("BEGIN");
  }

  async commit() {
    await this.client.query("COMMIT");
  }

  async rollback() {
    await this.client.query("ROLLBACK");
  }

  release() {
    this.client.release();
  }
}

class PgPoolAdapter {
  constructor() {
    this.pool = new Pool(createPoolConfig());

    Object.assign(this, wrapExecutor(this.pool));
  }

  async getConnection() {
    return new PgConnection(await this.pool.connect());
  }
}

export const pool = new PgPoolAdapter();
