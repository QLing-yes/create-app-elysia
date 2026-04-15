import type { Preferences } from "../../utils";

// 驱动名称到 Drizzle ORM 模块的映射
export const driverNamesToDrizzle: Record<Preferences["driver"], string> = {
  "node-postgres": "node-postgres",
  "Bun.sql": "bun-sql",
  "Postgres.JS": "postgres-js",
  "MySQL 2": "mysql2",
  "Bun SQLite": "bun-sqlite",
  None: "",
};

// 驱动名称到 npm 包名的映射
export const driverNames: Record<Preferences["driver"], string> = {
  "node-postgres": "pg",
  "Bun.sql": "??",
  "Postgres.JS": "postgres",
  "MySQL 2": "mysql2",
  "Bun SQLite": "bun:sqlite",
  None: "",
};

/**
 * 生成数据库入口文件 (src/db/index.ts)
 * 根据选择的 ORM 和驱动生成相应的数据库连接代码
 */
export function getDBIndex({ orm, driver, packageManager }: Preferences) {
  // Prisma ORM 配置
  if (orm === "Prisma")
    return [
      `import { PrismaClient } from "@prisma/client"`,
      "",
      "export const prisma = new PrismaClient()",
      "",
      `export * from "@prisma/client"`,
    ].join("\n");

  // Drizzle - node-postgres 驱动
  if (driver === "node-postgres")
    return [
      `import { drizzle } from "drizzle-orm/node-postgres"`,
      `import { Client } from "pg"`,
      `import { config } from "../config.ts"`,
      "",
      "export const client = new Client({",
      "  connectionString: config.DATABASE_URL,",
      "})",
      "",
      "export const db = drizzle({",
      "  client,",
      '  casing: "snake_case",',
      "})",
    ].join("\n");

  // Drizzle - Postgres.JS 驱动
  if (driver === "Postgres.JS")
    return [
      `import { drizzle } from "drizzle-orm/postgres-js"`,
      `import postgres from "postgres"`,
      `import { config } from "../config.ts"`,
      "",
      "const client = postgres(config.DATABASE_URL)",
      "export const db = drizzle({",
      "  client,",
      '  casing: "snake_case",',
      "})",
    ].join("\n");

  // Drizzle - Bun.sql 驱动
  if (driver === "Bun.sql")
    return [
      `import { drizzle } from "drizzle-orm/bun-sql"`,
      `import { config } from "../config.ts"`,
      `import { SQL } from "bun"`,
      "",
      "export const sql = new SQL(config.DATABASE_URL)",
      "",
      "export const db = drizzle({",
      "  client: sql,",
      '  casing: "snake_case",',
      "})",
    ].join("\n");

  // Drizzle - MySQL 2 驱动
  if (driver === "MySQL 2")
    return [
      `import { drizzle } from "drizzle-orm/mysql2"`,
      `import mysql from "mysql2/promise"`,
      `import { config } from "../config.ts"`,
      "",
      "export const connection = await mysql.createConnection(config.DATABASE_URL)",
      `console.log("🗄️ Database was connected!")`,
      "",
      "export const db = drizzle({",
      "  client: connection,",
      '  casing: "snake_case",',
      "})",
    ].join("\n");

  // Drizzle - Bun SQLite 驱动
  if (driver === "Bun SQLite" && packageManager === "bun")
    return [
      `import { drizzle } from "drizzle-orm/bun-sqlite"`,
      `import { Database } from "bun:sqlite";`,
      "",
      `export const sqlite = new Database("sqlite.db")`,
      "export const db = drizzle({",
      "  client: sqlite,",
      '  casing: "snake_case",',
      "})",
    ].join("\n");

  // Drizzle - better-sqlite3 驱动（默认）
  return [
    `import { drizzle } from "drizzle-orm/better-sqlite3"`,
    `import { Database } from "better-sqlite3";`,
    "",
    `export const sqlite = new Database("sqlite.db")`,
    "export const db = drizzle({",
    "  client: sqlite,",
    '  casing: "snake_case",',
    "})",
  ].join("\n");
}

/**
 * 生成 Drizzle ORM 配置文件 (drizzle.config.ts)
 * 用于数据库迁移和 schema 管理
 */
export function getDrizzleConfig({ database }: Preferences) {
  return [
    `import type { Config } from "drizzle-kit"`,
    `import env from "env-var"`,
    "",
    'const DATABASE_URL = env.get("DATABASE_URL").required().asString()',
    "",
    "export default {",
    `  schema: "./src/db/schema.ts",`,
    `  out: "./drizzle",`,
    `  dialect: "${database.toLowerCase()}",`,
    `  casing: "snake_case",`,
    "  dbCredentials: {",
    "    url: DATABASE_URL",
    "  }",
    "} satisfies Config",
  ].join("\n");
}
