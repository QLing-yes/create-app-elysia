/**
 * 步骤 2: 询问数据库配置
 * 根据项目类型决定是否显示（Monorepo 跳过）
 */

import enquirer from 'enquirer-esm';
const { prompt } = enquirer; 
import type { PreferencesType } from "../utils";

export interface DatabaseResult {
  orm: PreferencesType["orm"];
  database?: PreferencesType["database"];
  driver?: PreferencesType["driver"];
  mockWithPGLite?: PreferencesType["mockWithPGLite"];
}

/**
 * 询问用户数据库配置
 * 
 * @param isMonorepo 是否为单仓库模式（Monorepo 跳过数据库配置）
 * @param runtime 运行时环境（Bun/Node.js）
 * @returns 数据库配置结果
 */
export async function askDatabase(
  isMonorepo: boolean,
  runtime: "Bun" | "Node.js" = "Bun"
): Promise<DatabaseResult> {
  // Monorepo 模式跳过数据库配置（由根目录统一管理）
  if (isMonorepo) {
    return { orm: "None" };
  }

  // 选择 ORM
  const { orm } = await prompt<{ orm: PreferencesType["orm"] }>({
    type: "select",
    name: "orm",
    message: "Select ORM/Query Builder:",
    choices: ["None", "Prisma", "Drizzle"],
  });

  if (orm === "None") {
    return { orm };
  }

  // Prisma 数据库选择
  if (orm === "Prisma") {
    const { database } = await prompt<{
      database: PreferencesType["database"];
    }>({
      type: "select",
      name: "database",
      message: "Select DataBase for Prisma:",
      choices: [
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "SQLite",
        "SQLServer",
        "CockroachDB",
      ],
    });
    return { orm, database };
  }

  // Drizzle 数据库选择
  if (orm === "Drizzle") {
    const { database } = await prompt<{
      database: "PostgreSQL" | "MySQL" | "SQLite";
    }>({
      type: "select",
      name: "database",
      message: "Select DataBase for Drizzle:",
      choices: ["PostgreSQL", "MySQL", "SQLite"],
    });

    // 根据数据库类型提供驱动选择
    const driversMap: Record<typeof database, PreferencesType["driver"][]> = {
      PostgreSQL: (
        [
          runtime === "Bun" ? "Bun.sql" : undefined,
          "node-postgres",
          "Postgres.JS",
        ] as const
      ).filter((x) => x !== undefined),
      MySQL: ["MySQL 2"],
      SQLite: ["Bun SQLite"],
    };

    const { driver } = await prompt<{ driver: PreferencesType["driver"] }>({
      type: "select",
      name: "driver",
      message: `Select driver for ${database}:`,
      choices: driversMap[database],
    });

    // PostgreSQL 询问是否使用 PGLite 模拟测试
    let mockWithPGLite: PreferencesType["mockWithPGLite"] = false;
    if (database === "PostgreSQL") {
      const { mockWithPGLite: mock } = await prompt<{
        mockWithPGLite: PreferencesType["mockWithPGLite"];
      }>({
        type: "toggle",
        name: "mockWithPGLite",
        message:
          "Do you want to mock database in tests with PGLite (Postgres in WASM)?",
        initial: true,
      });
      mockWithPGLite = mock;
    }

    return { orm, database, driver, mockWithPGLite };
  }

  return { orm };
}
