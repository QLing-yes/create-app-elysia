import dedent from "ts-dedent";
import type { PreferencesType } from "../../utils";

// ORM 导出名称映射
const dbExportedMap = {
  Prisma: "prisma",
  Drizzle: "client",
};

/**
 * 生成主入口文件 (src/index.ts)
 * 负责应用启动、数据库连接、优雅关闭等
 */
export function getIndex({
  others,
  orm,
  driver,
  telegramRelated,
  isMonorepo,
}: PreferencesType): string {
  // 判断是否需要连接数据库（排除某些直接内联的驱动）
  const isShouldConnectToDB =
    orm !== "None" &&
    driver !== "Postgres.JS" &&
    driver !== "MySQL 2" &&
    driver !== "Bun SQLite" &&
    driver !== "Bun.sql";

  const gracefulShutdownTasks: string[] = [];
  const imports: string[] = [
    `import { config } from "./config.ts"`,
  ];
  const startUpTasks: string[] = [];

  // 导入 Elysia 应用
  imports.push(`import { app } from "./server.ts"`);
  // 优雅关闭时停止服务器
  gracefulShutdownTasks.push("await app.stop()");

  // 如果选择 Posthog，导入并添加关闭任务
  if (others.includes("Posthog")) {
    imports.push(`import { posthog } from "./services/posthog.ts"`);
    gracefulShutdownTasks.push("await posthog.shutdown()");
  }

  // 如果需要连接数据库，添加连接和关闭任务
  if (isShouldConnectToDB) {
    imports.push(`import { ${dbExportedMap[orm]} } from "./db/index.ts"`);
    startUpTasks.push(
      dedent /* ts */ `${orm === "Prisma" ? "await prisma.$connect()" : "await client.connect()"}
      console.log("🗄️ Database was connected!")`
    );
  }

  // 启动服务器
  startUpTasks.push(
    /*ts*/ `app.listen(config.PORT, () => console.log(\`🦊 Server started at \${app.server?.url.origin}\`))`
  );

  // 如果与 Telegram 相关且不是单仓库，导入 bot 并启动
  if (telegramRelated && !isMonorepo) {
    imports.push(`import { bot } from "./bot.ts"`);
    startUpTasks.push(
      dedent /* ts */ `if (config.NODE_ENV === "production")
          await bot.start({
              webhook: {
                  url: \`\${config.API_URL}/\${config.BOT_TOKEN}\`,
              },
          });
      else await bot.start();`
    );
  }

  // 生成入口文件代码
  return dedent /* sts */ `
  ${imports.join("\n")}
  const signals = ["SIGINT", "SIGTERM"];

  for (const signal of signals) {
      process.on(signal, async () => {
          console.log(\`Received \${signal}. Initiating graceful shutdown...\`);
          ${gracefulShutdownTasks.join("\n")}
          process.exit(0);
      })
  }

  process.on("uncaughtException", (error) => {
      console.error(error);
  })

  process.on("unhandledRejection", (error) => {
      console.error(error);
  })

  ${startUpTasks.join("\n")}`;
}
