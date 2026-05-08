import { dedent } from "ts-dedent";
import type { PreferencesType } from "../../../types";

export function getDrizzleLib(prefs: PreferencesType): string {
  const db = prefs.database;
  if (db === "MySQL") return mySQLTemplate();
  if (db === "PostgreSQL") return pgTemplate(prefs.driver);
  return sqliteTemplate();
}

function mySQLTemplate(): string {
  return dedent`
    import { drizzle as orm } from "drizzle-orm/mysql2";
    import mysql from "mysql2/promise";
    import { logger } from "@/app/lib/logger";
    import { table as post, tableRelations as postRelations } from "../model/post.mold";
    import { table as user, tableRelations as userRelations } from "../model/user.mold";

    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL!,
      waitForConnections: true,
      connectionLimit: 10,
    });
    registerEvent();
    export const drizzle = orm(pool, {
      schema: { post, postRelations, user, userRelations },
      mode: "default",
    });
    export default drizzle;

    function registerEvent() {
      pool.pool.on("error", (err: Error) => {
        logger.error("[drizzle] error", err);
      });
      pool.on("enqueue", () => {
        logger.warn("[drizzle] connection pool is full");
      });
      pool
        .getConnection()
        .then((conn) => {
          logger.info("[drizzle] connected successfully");
          conn.release();
        })
        .catch((err) => {
          logger.error(\`[drizzle] connection failed:\${err}\`);
        });
    }
  `;
}

function pgTemplate(driver: string): string {
  if (driver === "node-postgres") {
    return dedent`
      import { drizzle as orm } from "drizzle-orm/node-postgres";
      import { Pool } from "pg";
      import { logger } from "@/app/lib/logger";
      import { table as post, tableRelations as postRelations } from "../model/post.mold";
      import { table as user, tableRelations as userRelations } from "../model/user.mold";

      const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
      registerEvent();
      export const drizzle = orm(pool, {
        schema: { post, postRelations, user, userRelations },
      });
      export default drizzle;

      function registerEvent() {
        pool.on("error", (err: Error) => {
          logger.error("[drizzle] error", err);
        });
        pool
          .connect()
          .then((client) => {
            logger.info("[drizzle] connected successfully");
            client.release();
          })
          .catch((err) => {
            logger.error(\`[drizzle] connection failed:\${err}\`);
          });
      }
    `;
  }
  if (driver === "Postgres.JS") {
    return dedent`
      import { drizzle as orm } from "drizzle-orm/postgres-js";
      import postgres from "postgres";
      import { logger } from "@/app/lib/logger";
      import { table as post, tableRelations as postRelations } from "../model/post.mold";
      import { table as user, tableRelations as userRelations } from "../model/user.mold";

      const client = postgres(process.env.DATABASE_URL!);
      export const drizzle = orm(client, {
        schema: { post, postRelations, user, userRelations },
      });
      export default drizzle;
      logger.info("[drizzle] connected");
    `;
  }
  // Bun.sql
  return dedent`
    import { drizzle as orm } from "drizzle-orm/bun-sql";
    import { SQL } from "bun";
    import { logger } from "@/app/lib/logger";
    import { table as post, tableRelations as postRelations } from "../model/post.mold";
    import { table as user, tableRelations as userRelations } from "../model/user.mold";

    const client = new SQL({ url: process.env.DATABASE_URL! });
    export const drizzle = orm(client, {
      schema: { post, postRelations, user, userRelations },
    });
    export default drizzle;
    logger.info("[drizzle] connected");
  `;
}

function sqliteTemplate(): string {
  return dedent`
    import { drizzle as orm } from "drizzle-orm/bun-sqlite";
    import { Database } from "bun:sqlite";
    import { logger } from "@/app/lib/logger";
    import { table as post, tableRelations as postRelations } from "../model/post.mold";
    import { table as user, tableRelations as userRelations } from "../model/user.mold";

    const client = new Database(process.env.DATABASE_URL!);
    export const drizzle = orm(client, {
      schema: { post, postRelations, user, userRelations },
    });
    export default drizzle;
    logger.info("[drizzle] connected");
  `;
}
