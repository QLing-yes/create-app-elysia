/**
 * 步骤 1: ORM → 数据库 → 驱动 → PGLite
 * Monorepo 模式下跳过（数据库由根目录统一管理）
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;
import type { PreferencesType } from "../utils";

export interface DatabaseResult {
  orm: PreferencesType["orm"];
  database?: PreferencesType["database"];
  driver?: PreferencesType["driver"];
  mockWithPGLite?: boolean;
}

export async function askDatabase(
  isMonorepo: boolean,
  runtime: "Bun" | "Node.js" = "Bun",
): Promise<DatabaseResult> {
  if (isMonorepo) {
    return { orm: "None" };
  }

  const { orm } = await prompt<{ orm: PreferencesType["orm"] }>({
    type: "select",
    name: "orm",
    message: "选择 ORM/查询构建器：",
    choices: ["None", "Prisma", "Drizzle"],
  });

  if (orm === "None") {
    return { orm };
  }

  if (orm === "Prisma") {
    const { database } = await prompt<{ database: PreferencesType["database"] }>({
      type: "select",
      name: "database",
      message: "为 Prisma 选择数据库：",
      choices: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "SQLServer", "CockroachDB"],
    });
    return { orm, database };
  }

  if (orm === "Drizzle") {
    const { database } = await prompt<{ database: "PostgreSQL" | "MySQL" | "SQLite" }>({
      type: "select",
      name: "database",
      message: "为 Drizzle 选择数据库：",
      choices: ["PostgreSQL", "MySQL", "SQLite"],
    });

    const driversMap: Record<string, string[]> = {
      PostgreSQL: [runtime === "Bun" ? "Bun.sql" : undefined, "node-postgres", "Postgres.JS"].filter(
        (x): x is string => x !== undefined,
      ),
      MySQL: ["MySQL 2"],
      SQLite: ["Bun SQLite"],
    };

    const { driver } = await prompt<{ driver: string }>({
      type: "select",
      name: "driver",
      message: `为 ${database} 选择驱动：`,
      choices: driversMap[database],
    });

    let mockWithPGLite = false;
    if (database === "PostgreSQL") {
      const result = await prompt<{ mockWithPGLite: boolean }>({
        type: "toggle",
        name: "mockWithPGLite",
        message: "是否在测试中使用 PGLite（WASM 版 Postgres）模拟数据库？",
        initial: true,
      });
      mockWithPGLite = result.mockWithPGLite;
    }

    return { orm, database, driver: driver as PreferencesType["driver"], mockWithPGLite };
  }

  return { orm };
}
