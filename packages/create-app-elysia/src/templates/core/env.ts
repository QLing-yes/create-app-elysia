import { randomBytes } from "node:crypto";
import dedent from "ts-dedent";
import type { Preferences, PreferencesType } from "../../utils";

// 数据库连接 URL 示例映射
const connectionURLExamples: Record<
  InstanceType<typeof Preferences>["database"],
  string
> = {
  PostgreSQL: "postgresql://root:mypassword@localhost:5432/mydb",
  MySQL: "mysql://root:mypassword@localhost:3306/mydb",
  SQLServer:
    "sqlserver://localhost:1433;database=mydb;user=root;password=mypassword;",
  CockroachDB:
    "postgresql://root:mypassword@localhost:26257/mydb?schema=public",
  MongoDB:
    "mongodb+srv://root:mypassword@cluster0.ab1cd.mongodb.net/mydb?retryWrites=true&w=majority",
  SQLite: "file:./sqlite.db",
};

// Docker Compose 服务名称映射
const composeServiceNames: Record<
  InstanceType<typeof Preferences>["database"],
  string
> = {
  PostgreSQL: "postgres",
  MySQL: "localhost",
  SQLServer: "localhost",
  CockroachDB: "localhost",
  MongoDB: "localhost",
  SQLite: "file:./sqlite.db",
};

/**
 * 生成环境变量文件 (.env)
 */
export function getEnvFile(
  {
    database,
    orm,
    plugins,
    projectName,
    redis,
    meta,
    telegramRelated,
  }: PreferencesType,
  isComposed = false
) {
  const envs: string[] = [];

  // 如果配置了 ORM，生成数据库连接 URL
  if (orm !== "None") {
    let url = connectionURLExamples[database]
      .replace("mydb", projectName)
      .replace("root", projectName)
      .replace("mypassword", meta.databasePassword);

    // 在 Docker Compose 环境下，使用服务名称代替 localhost
    if (isComposed)
      url = url.replace("localhost", composeServiceNames[database]);

    envs.push(`DATABASE_URL="${url}"`);
  }

  // 如果与 Telegram 相关，添加 Bot Token
  if (telegramRelated) {
    envs.push(`BOT_TOKEN=""`);
  }

  // 在 Docker Compose 环境下且使用 Redis，设置 Redis 主机
  if (isComposed && redis) envs.push("REDIS_HOST=redis");

  // 如果选择 JWT 插件，生成密钥
  if (plugins.includes("JWT"))
    envs.push(`JWT_SECRET="${randomBytes(12).toString("hex")}"`);

  // 添加端口配置
  envs.push("PORT=3000");
  return envs.join("\n");
}
