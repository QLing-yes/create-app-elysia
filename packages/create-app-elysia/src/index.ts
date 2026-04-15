#!/usr/bin/env node
/**
 * Create Elysia App - 主入口文件
 *
 * 第四层：执行主控层
 * 负责串联所有层级，实现项目生成流程
 * 
 * 流程顺序：
 * 1. 解析命令行参数
 * 2. 检测包管理器
 * 3. 创建项目目录
 * 4. 漏斗式交互收集用户偏好
 * 5. 生成基础文件（总是生成）
 * 6. 条件生成文件（根据用户选择）
 * 7. 安装依赖
 * 8. 完成提示
 */

import fs from "node:fs/promises";
import path from "node:path";
import minimist from "minimist";
import task from "tasuku";
import dedent from "ts-dedent";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import enquirer from 'enquirer';
const { prompt } = enquirer; 

// ========== 第一层：工具层 ==========
import {
  createOrFindDir,
  writeFile,
  detectPackageManager,
  Preferences,
  resolvePath,
  joinPath,
  info,
  success,
  error,
  title,
  divider,
  step,
} from "./utils/index";

// ========== 第二层：交互层 ==========
import {
  askProjectType,
  askDatabase,
  askPlugins,
  askIntegrations,
  askDevTools,
  printFormatHint,
} from "./prompts";

// ========== 第三层：模板层 ==========
import {
  getPackageJson,
  getTSConfig,
  getGitIgnore,
  getReadme,
  getElysiaIndex,
  getIndex,
  getConfigFile,
  getDBIndex,
  getDrizzleConfig,
  generateEslintConfig,
  getDockerfile,
  getDockerCompose,
  getDevelopmentDockerCompose,
  getVSCodeExtensions,
  getVSCodeSettings,
  getAuthPlugin,
  getJobifyFile,
  getLocksFile,
  getPosthogIndex,
  getRedisFile,
  getS3ServiceFile,
  getPreloadFile,
  getTestsAPIFile,
  getTestsIndex,
  getTestSharedFile,
  getBotFile,
  getInstallCommands,
  getEnvFile,
} from "./templates";

// ========== 辅助函数 ==========
const execAsync = promisify(exec);

// ========== 错误处理 ==========
process.on("unhandledRejection", async (err) => {
  console.error(err);
  error("Unhandled rejection detected. The process will be terminated.");
  process.exit(1);
});

// ========== 主函数 ==========
async function main() {
  // 1. 解析命令行参数
  const args = minimist(process.argv.slice(2));
  const dir = args._.at(0);

  if (!dir) {
    throw new Error(
      "Specify the folder like this - bun create elysiajs dir-name"
    );
  }

  // 2. 检测包管理器（目前仅支持 Bun）
  const packageManager = args.pm || detectPackageManager();
  if (packageManager !== "bun") {
    throw new Error("Currently only Bun is supported");
  }

  const projectDir = resolvePath(dir);
  const projectName = path.basename(projectDir);

  // 3. 创建项目目录
  await createOrFindDir(projectDir);

  // 4. 漏斗式交互收集用户偏好
  title("🚀 Create Elysia App");
  divider();

  step("Collecting preferences...");

  // 4.1 项目类型选择
  const { isMonorepo } = await askProjectType();

  const runtime: "Bun" | "Node.js" = packageManager === "bun" ? "Bun" : "Node.js";

  // 4.2 数据库配置（Monorepo 跳过）
  const dbConfig = await askDatabase(isMonorepo, runtime);

  // 4.3 Elysia 插件选择
  const { plugins } = await askPlugins();

  // 4.4 集成工具选择（Monorepo 精简）
  const integrations = await askIntegrations(isMonorepo);

  // 4.5 开发工具选择（Monorepo 精简）
  const devTools = await askDevTools(
    isMonorepo,
    integrations.others.includes("Husky")
  );

  // 5. 组装 Preferences 对象
  const preferences = new Preferences();
  preferences.dir = dir;
  preferences.projectName = projectName;
  preferences.packageManager = packageManager;
  preferences.runtime = runtime;
  preferences.isMonorepo = isMonorepo;

  // 数据库配置
  preferences.orm = dbConfig.orm;
  preferences.database = dbConfig.database || "PostgreSQL";
  preferences.driver = dbConfig.driver || "None";
  preferences.mockWithPGLite = dbConfig.mockWithPGLite || false;

  // 插件和集成
  preferences.plugins = plugins;
  preferences.others = integrations.others;
  preferences.s3Client = integrations.s3Client || "None";
  preferences.redis = integrations.redis;
  preferences.locks = integrations.locks;
  preferences.telegramRelated = integrations.telegramRelated;

  // 开发工具
  preferences.linter = devTools.linter;
  preferences.docker = devTools.docker;
  preferences.vscode = devTools.vscode;
  preferences.git = devTools.git;

  // 安装配置
  // biome-ignore lint/complexity/noExtraBooleanCast: 保持原有逻辑
  preferences.noInstall = !Boolean(args.install ?? true);

  // 6. 检查目录是否为空，如果不为空则询问是否覆盖
  const filesInTargetDirectory = await fs
    .readdir(projectDir)
    .catch(() => []);
  if (filesInTargetDirectory.length) {
    const { overwrite } = await prompt<{ overwrite: boolean }>({
      type: "toggle",
      name: "overwrite",
      message: `\n${filesInTargetDirectory.join(
        "\n"
      )}\n\nThe directory ${projectName} is not empty. Do you want to delete the files?`,
      initial: true,
    });

    if (!overwrite) {
      info("Cancelled...");
      process.exit(0);
    }

    await fs.rm(projectDir, { recursive: true });
    await createOrFindDir(projectDir);
  }

  divider();

  // 7. 生成文件
  await task("Generating project files...", async ({ setTitle }) => {
    // ========== 7.1 基础文件（总是生成） ==========
    step("Writing base files...");

    await writeFile(
      joinPath(projectDir, "package.json"),
      getPackageJson(preferences)
    );

    await writeFile(
      joinPath(projectDir, "tsconfig.json"),
      getTSConfig(preferences)
    );

    await writeFile(joinPath(projectDir, ".gitignore"), getGitIgnore());

    await writeFile(joinPath(projectDir, "README.md"), getReadme(preferences));

    await writeFile(joinPath(projectDir, ".env"), getEnvFile(preferences));

    await writeFile(
      joinPath(projectDir, ".env.production"),
      getEnvFile(preferences, true)
    );

    // ========== 7.2 核心文件（总是生成） ==========
    step("Writing core files...");

    await createOrFindDir(joinPath(projectDir, "src"));

    await writeFile(
      joinPath(projectDir, "src/server.ts"),
      getElysiaIndex(preferences)
    );

    await writeFile(
      joinPath(projectDir, "src/index.ts"),
      getIndex(preferences)
    );

    await writeFile(
      joinPath(projectDir, "src/config.ts"),
      getConfigFile(preferences)
    );

    // 创建路由目录（为 Autoload 插件准备）
    await createOrFindDir(joinPath(projectDir, "src/routes"));

    // ========== 7.3 数据库文件（条件生成） ==========
    if (preferences.orm !== "None") {
      step("Writing database files...");

      await createOrFindDir(joinPath(projectDir, "src/db"));

      await writeFile(
        joinPath(projectDir, "src/db/index.ts"),
        getDBIndex(preferences)
      );

      if (preferences.orm === "Drizzle") {
        await writeFile(
          joinPath(projectDir, "drizzle.config.ts"),
          getDrizzleConfig(preferences)
        );

        // 生成 schema 占位文件
        const schemaContent =
          preferences.database === "PostgreSQL"
            ? `// import { pgTable } from "drizzle-orm/pg-core"`
            : preferences.database === "MySQL"
            ? `// import { mysqlTable } from "drizzle-orm/mysql-core"`
            : `// import { sqliteTable } from "drizzle-orm/sqlite-core"`;

        await writeFile(joinPath(projectDir, "src/db/schema.ts"), schemaContent);

        // 如果选择 SQLite，创建数据库文件
        if (preferences.database === "SQLite") {
          await writeFile(joinPath(projectDir, "sqlite.db"), "");
        }
      }
    }

    // ========== 7.4 服务文件（条件生成） ==========
    await createOrFindDir(joinPath(projectDir, "src/services"));

    if (preferences.others.includes("Posthog")) {
      await writeFile(
        joinPath(projectDir, "src/services/posthog.ts"),
        getPosthogIndex()
      );
    }

    if (preferences.others.includes("Jobify")) {
      await writeFile(
        joinPath(projectDir, "src/services/jobify.ts"),
        getJobifyFile()
      );
      await createOrFindDir(joinPath(projectDir, "src/jobs"));
    }

    if (preferences.redis) {
      await writeFile(
        joinPath(projectDir, "src/services/redis.ts"),
        getRedisFile()
      );
    }

    if (preferences.locks) {
      await writeFile(
        joinPath(projectDir, "src/services/locks.ts"),
        getLocksFile(preferences)
      );
    }

    if (preferences.s3Client !== "None") {
      await writeFile(
        joinPath(projectDir, "src/services/s3.ts"),
        getS3ServiceFile(preferences)
      );
    }

    if (preferences.telegramRelated) {
      await writeFile(
        joinPath(projectDir, "src/services/auth.plugin.ts"),
        getAuthPlugin()
      );
    }

    // ========== 7.5 开发工具文件（条件生成） ==========
    if (preferences.linter === "ESLint") {
      await writeFile(
        joinPath(projectDir, "eslint.config.mjs"),
        generateEslintConfig(preferences)
      );
    }

    if (preferences.docker) {
      await writeFile(
        joinPath(projectDir, "Dockerfile"),
        getDockerfile(preferences)
      );

      await writeFile(
        joinPath(projectDir, "docker-compose.dev.yml"),
        getDevelopmentDockerCompose(preferences)
      );

      await writeFile(
        joinPath(projectDir, "docker-compose.yml"),
        getDockerCompose(preferences)
      );
    }

    if (preferences.vscode) {
      await createOrFindDir(joinPath(projectDir, ".vscode"));

      await writeFile(
        joinPath(projectDir, ".vscode/settings.json"),
        getVSCodeSettings(preferences)
      );

      await writeFile(
        joinPath(projectDir, ".vscode/extensions.json"),
        getVSCodeExtensions(preferences)
      );
    }

    // ========== 7.6 测试文件（条件生成） ==========
    if (preferences.mockWithPGLite) {
      step("Writing test files...");

      await createOrFindDir(joinPath(projectDir, "tests"));

      await writeFile(
        joinPath(projectDir, "tests/preload.ts"),
        getPreloadFile(preferences)
      );

      await writeFile(
        joinPath(projectDir, "tests/api.ts"),
        getTestsAPIFile(preferences)
      );

      await createOrFindDir(joinPath(projectDir, "tests/e2e"));

      await writeFile(
        joinPath(projectDir, "tests/e2e/index.test.ts"),
        getTestsIndex(preferences)
      );

      // 生成 Bun 测试配置文件
      await writeFile(
        joinPath(projectDir, "bunfig.toml"),
        dedent /* toml */ `[test]
        preload = ["./tests/preload.ts"]
      `
      );

      // 如果与 Telegram 相关，生成共享测试工具
      if (preferences.telegramRelated) {
        await writeFile(
          joinPath(projectDir, "tests/shared.ts"),
          getTestSharedFile()
        );
      }
    }

    // ========== 7.7 Telegram Bot 文件（条件生成） ==========
    if (preferences.telegramRelated && !preferences.isMonorepo) {
      await writeFile(joinPath(projectDir, "src/bot.ts"), getBotFile());
    }

    setTitle("✅ Template generation is complete!");
  });

  // 8. 安装依赖
  if (!preferences.noInstall) {
    const commands = getInstallCommands(preferences);

    for (const command of commands) {
      await task(command, async () => {
        await execAsync(command, {
          cwd: projectDir,
        }).catch((e) => console.error(e));
      });
    }
  }

  // 9. 完成提示
  divider();
  success("🎉 Project created successfully!");
  divider();

  console.log(`
📁 Project location: ${projectDir}

🚀 Next steps:
   cd ${dir}
   bun dev

💡 Tip: To format your code, run one of the following commands after installation:
   bun run lint:fix
   
   Or with ultracite:
   npx ultracite init
   npx ultracite fix
`);

  printFormatHint(packageManager);
}

// 启动主函数
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
