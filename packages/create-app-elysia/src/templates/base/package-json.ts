import { dependencies, devDependencies } from "../../deps";
import type { Dependencies, DevDependencies } from "../../dependency/types";
import { type Preferences, pmExecuteMap, pmRunMap } from "../../utils";

/**
 * 生成 package.json 文件
 * 根据用户选择动态添加依赖和脚本
 */
export function getPackageJson({
  dir,
  projectName,
  linter,
  packageManager,
  orm,
  driver,
  others,
  plugins,
  isMonorepo,
  locks,
  redis,
  mockWithPGLite,
  telegramRelated,
  s3Client,
}: Preferences) {
  const sample = {
    name: projectName,
    type: "module",
    scripts: {
      // 开发脚本：Bun 使用 --watch，其他使用 tsx
      dev:
        packageManager === "bun"
          ? "bun --watch src/index.ts"
          : `${pmExecuteMap[packageManager]} tsx watch --env-file .env src/index.ts`,
      // 生产启动脚本
      start:
        packageManager === "bun"
          ? "NODE_ENV=production bun run ./src/index.ts"
          : `NODE_ENV=production ${pmExecuteMap[packageManager]} tsx --env-file=.env --env-file=.env.production src/index.ts`,
    } as Record<string, string>,
    dependencies: {
      elysia: dependencies.elysia,
      "env-var": dependencies["env-var"],
    } as Partial<Dependencies>,
    devDependencies: {
      typescript: devDependencies.typescript,
    } as Partial<DevDependencies>,
  };

  // 添加 Bun 类型定义
  sample.devDependencies["@types/bun"] = devDependencies["@types/bun"];

  // 配置 Biome 代码检查工具
  if (linter === "Biome") {
    sample.scripts.lint = `${pmExecuteMap[packageManager]} @biomejs/biome check src`;
    sample.scripts["lint:fix"] = `${pmRunMap[packageManager]} lint --write`;
    sample.devDependencies["@biomejs/biome"] = devDependencies["@biomejs/biome"];
  }
  // 配置 ESLint 代码检查工具
  if (linter === "ESLint") {
    sample.scripts.lint = `${pmExecuteMap[packageManager]} eslint`;
    sample.scripts["lint:fix"] = `${pmExecuteMap[packageManager]} eslint --fix`;
    sample.devDependencies.eslint = devDependencies.eslint;
    sample.devDependencies["@antfu/eslint-config"] =
      devDependencies["@antfu/eslint-config"];
    // 如果使用 Drizzle，添加其 ESLint 插件
    if (orm === "Drizzle")
      sample.devDependencies["eslint-plugin-drizzle"] =
        devDependencies["eslint-plugin-drizzle"];
  }

  // 配置 Prisma ORM
  if (orm === "Prisma") {
    sample.devDependencies.prisma = devDependencies.prisma;
    sample.dependencies["@prisma/client"] = dependencies["@prisma/client"];
  }
  // 配置 Drizzle ORM 及其驱动
  if (orm === "Drizzle") {
    sample.dependencies["drizzle-orm"] = dependencies["drizzle-orm"];
    sample.devDependencies["drizzle-kit"] = devDependencies["drizzle-kit"];
    if (driver === "node-postgres") {
      sample.dependencies.pg = dependencies.pg;
      sample.devDependencies["@types/pg"] = devDependencies["@types/pg"];
    }
    if (driver === "Postgres.JS") {
      sample.dependencies.postgres = dependencies.postgres;
    }
    if (driver === "MySQL 2") {
      sample.dependencies.mysql2 = dependencies.mysql2;
    }
    // Drizzle 迁移命令
    sample.scripts.generate = `${pmExecuteMap[packageManager]} drizzle-kit generate`;
    sample.scripts.push = `${pmExecuteMap[packageManager]} drizzle-kit push`;
    sample.scripts.migrate = `${pmExecuteMap[packageManager]} drizzle-kit migrate`;
    sample.scripts.studio = `${pmExecuteMap[packageManager]} drizzle-kit studio`;
  }

  // 配置 Husky Git Hooks
  if (others.includes("Husky")) {
    sample.devDependencies.husky = devDependencies.husky;
    sample.scripts.prepare = "husky";
  }

  // 添加 Elysia 插件依赖
  if (plugins.includes("Bearer"))
    sample.dependencies["@elysiajs/bearer"] = dependencies["@elysiajs/bearer"];
  if (plugins.includes("CORS"))
    sample.dependencies["@elysiajs/cors"] = dependencies["@elysiajs/cors"];
  if (plugins.includes("HTML/JSX")) {
    sample.dependencies["@elysiajs/html"] = dependencies["@elysiajs/html"];
    sample.dependencies["@kitajs/ts-html-plugin"] =
      dependencies["@kitajs/ts-html-plugin"];
  }
  if (plugins.includes("JWT"))
    sample.dependencies["@elysiajs/jwt"] = dependencies["@elysiajs/jwt"];
  if (plugins.includes("Server Timing"))
    sample.dependencies["@elysiajs/server-timing"] =
      dependencies["@elysiajs/server-timing"];
  if (plugins.includes("Static"))
    sample.dependencies["@elysiajs/static"] = dependencies["@elysiajs/static"];
  if (plugins.includes("Swagger"))
    sample.dependencies["@elysiajs/swagger"] =
      dependencies["@elysiajs/swagger"];
  if (plugins.includes("Autoload"))
    sample.dependencies["elysia-autoload"] = dependencies["elysia-autoload"];
  if (plugins.includes("Logger"))
    sample.dependencies["@bogeychan/elysia-logger"] =
      dependencies["@bogeychan/elysia-logger"];

  // OAuth 2.0 相关依赖
  if (plugins.includes("Oauth 2.0")) {
    sample.dependencies.arctic = dependencies.arctic;
    sample.dependencies["elysia-oauth2"] = dependencies["elysia-oauth2"];
  }

  // Redis 相关依赖
  if (redis) {
    sample.dependencies.ioredis = dependencies.ioredis;
    if (mockWithPGLite)
      sample.devDependencies["ioredis-mock"] = devDependencies["ioredis-mock"];
  }

  // 任务队列依赖
  if (others.includes("Jobify")) {
    sample.dependencies.jobify = dependencies.jobify;
  }

  // 产品分析依赖
  if (others.includes("Posthog")) {
    sample.dependencies["posthog-node"] = dependencies["posthog-node"];
  }

  // 分布式锁依赖
  if (locks) {
    sample.dependencies["@verrou/core"] = dependencies["@verrou/core"];
  }

  // 单仓库模式依赖
  if (isMonorepo)
    sample.dependencies["@gramio/init-data"] =
      dependencies["@gramio/init-data"];

  // S3 存储依赖
  if (others.includes("S3") && s3Client === "@aws-sdk/client-s3") {
    sample.dependencies["@aws-sdk/client-s3"] =
      dependencies["@aws-sdk/client-s3"];
  }

  // 测试模拟依赖
  if (mockWithPGLite) {
    sample.devDependencies["@electric-sql/pglite"] =
      devDependencies["@electric-sql/pglite"];
    sample.devDependencies["@elysiajs/eden"] = devDependencies["@elysiajs/eden"];
  }

  // Telegram Bot 依赖
  if (telegramRelated && !isMonorepo) {
    sample.dependencies.gramio = dependencies.gramio;
    sample.dependencies["@gramio/init-data"] =
      dependencies["@gramio/init-data"];
  }

  return JSON.stringify(sample, null, 2);
}
