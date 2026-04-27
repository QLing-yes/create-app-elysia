#!/usr/bin/env node
/**
 * Create Elysia App - 主入口文件
 *
 * 第四层：执行主控层
 * 负责串联所有层级，实现项目生成流程
 *
 * 流程顺序：
 * 1. 解析命令行参数
 * 2. 检测包管理器和 monorepo 环境
 * 3. 根据环境分支处理
 *    - Monorepo 内创建新 app
 *    - 创建新 Monorepo
 *    - 创建 Standalone 项目
 * 4. 漏斗式交互收集用户偏好
 * 5. 生成文件
 * 6. 安装依赖
 * 7. 完成提示
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
import { detectMonorepo, getMonorepoWorkspaces } from "./utils/monorepo-detector";

// ========== 第二层：交互层 ==========
import {
  askMonorepoContext,
  askMonorepoLocation,
  askMonorepoName,
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
  // Monorepo 模板
  getMonorepoRootPackageJson,
  getTurboJson,
  getWorkspacePackageJson,
  getMonorepoAppPackageJson,
  getMonorepoRootTsConfig,
  getContractIndex,
  getContractPackageJson,
  getTsConfigPackage,
  getBaseTsConfig,
  getMonorepoGitignore,
  getMonorepoReadme,
  // Monorepo App 模板
  getMonorepoNewAppPackageJson,
  getMonorepoAppServer,
  getMonorepoAppTsConfig,
  getMonorepoAppBiomeConfig,
  getMonorepoAppGitignore,
  getMonorepoAppReadme,
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

  const runtime: "Bun" | "Node.js" = packageManager === "bun" ? "Bun" : "Node.js";

  // 3. 检测 monorepo 环境
  const monorepoResult = await detectMonorepo(process.cwd());

  // 4. Monorepo 上下文处理
  title("🚀 Create Elysia App");
  divider();
  step("Collecting preferences...");

  const monorepoContext = await askMonorepoContext(
    monorepoResult.isMonorepo,
    monorepoResult.rootPath
  );

  // ========== 分支 1: 在现有 monorepo 中创建新 app ==========
  if (monorepoContext.isMonorepo && !monorepoContext.createNewMonorepo && monorepoContext.monorepoRoot) {
    await createInExistingMonorepo(
      monorepoContext.monorepoRoot,
      monorepoResult.workspaces,
      packageManager,
      runtime
    );
    return;
  }

  // ========== 分支 2: 创建新的 Monorepo ==========
  if (monorepoContext.isMonorepo && monorepoContext.createNewMonorepo) {
    await createNewMonorepo(dir, packageManager, runtime, args);
    return;
  }

  // ========== 分支 3: 创建 Standalone 项目 ==========
  await createStandaloneProject(dir, packageManager, runtime, args);
}

// 启动主函数
main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// ========== 功能函数 ==========

/**
 * 创建新的 Monorepo 项目
 */
async function createNewMonorepo(
  dir: string,
  packageManager: string,
  runtime: "Bun" | "Node.js",
  args: Record<string, unknown>
) {
  const projectDir = resolvePath(dir);
  const projectName = path.basename(projectDir);

  // 询问 monorepo 名称
  const monorepoName = await askMonorepoName();

  // 检查目录是否为空
  await checkAndClearDirectory(projectDir, projectName);

  divider();

  // 生成 Monorepo 根目录文件
  await task("Generating monorepo structure...", async ({ setTitle }) => {
    step("Writing root files...");

    // 根目录 package.json
    await writeFile(
      joinPath(projectDir, "package.json"),
      getMonorepoRootPackageJson(monorepoName)
    );

    // turbo.json
    await writeFile(joinPath(projectDir, "turbo.json"), getTurboJson());

    // tsconfig.json
    await writeFile(
      joinPath(projectDir, "tsconfig.json"),
      getMonorepoRootTsConfig()
    );

    // .gitignore
    await writeFile(joinPath(projectDir, ".gitignore"), getMonorepoGitignore());

    // README.md
    await writeFile(
      joinPath(projectDir, "README.md"),
      getMonorepoReadme(monorepoName)
    );

    // biome.json (根目录代码质量配置)
    await writeFile(
      joinPath(projectDir, "biome.json"),
      JSON.stringify(
        {
          $schema: "https://biomejs.dev/schemas/2.2.3/schema.json",
          formatter: {
            enabled: true,
            indentStyle: "space",
            indentWidth: 2,
          },
          linter: {
            enabled: true,
            rules: {
              recommended: true,
            },
          },
        },
        null,
        2
      )
    );

    // 创建 packages/contract
    step("Writing packages/contract...");
    const contractDir = joinPath(projectDir, "packages", "contract", "src");
    await createOrFindDir(contractDir);
    await writeFile(
      joinPath(projectDir, "packages/contract/package.json"),
      getContractPackageJson()
    );
    await writeFile(
      joinPath(projectDir, "packages/contract/src/index.ts"),
      getContractIndex()
    );
    await writeFile(
      joinPath(projectDir, "packages/contract/tsconfig.json"),
      JSON.stringify(
        {
          extends: "@repo/tsconfig/base.json",
          compilerOptions: {
            module: "ESNext",
            moduleResolution: "bundler",
            noEmit: true,
            skipLibCheck: true,
          },
          include: ["src/**/*"],
          exclude: ["node_modules", "dist"],
        },
        null,
        2
      )
    );

    // 创建 packages/tsconfig
    step("Writing packages/tsconfig...");
    const tsconfigDir = joinPath(projectDir, "packages", "tsconfig");
    await createOrFindDir(tsconfigDir);
    await writeFile(
      joinPath(projectDir, "packages/tsconfig/package.json"),
      getTsConfigPackage()
    );
    await writeFile(
      joinPath(projectDir, "packages/tsconfig/base.json"),
      getBaseTsConfig()
    );

    // 创建 apps/api (Elysia 后端)
    step("Writing apps/api...");
    const apiDir = joinPath(projectDir, "apps", "api", "src");
    await createOrFindDir(apiDir);
    await writeFile(
      joinPath(projectDir, "apps/api/package.json"),
      getMonorepoAppPackageJson("api")
    );
    await writeFile(
      joinPath(projectDir, "apps/api/src/server.ts"),
      getMonorepoAppServer("api")
    );
    await writeFile(
      joinPath(projectDir, "apps/api/tsconfig.json"),
      getMonorepoAppTsConfig()
    );
    await writeFile(
      joinPath(projectDir, "apps/api/biome.json"),
      getMonorepoAppBiomeConfig()
    );
    await writeFile(
      joinPath(projectDir, "apps/api/.gitignore"),
      getMonorepoAppGitignore()
    );
    await writeFile(
      joinPath(projectDir, "apps/api/README.md"),
      getMonorepoAppReadme("api")
    );

    setTitle("✅ Monorepo structure is complete!");
  });

  // 安装依赖
  const noInstall = !Boolean(args.install ?? true);
  if (!noInstall) {
    await task("Installing dependencies...", async () => {
      await execAsync("bun install", { cwd: projectDir }).catch((e) =>
        console.error(e)
      );
    });
  }

  // 完成提示
  divider();
  success("🎉 Monorepo created successfully!");
  divider();

  console.log(`
📁 Project location: ${projectDir}

🚀 Next steps:
   cd ${dir}
   bun run dev

📦 Structure:
   apps/api/     - Elysia backend
   packages/contract - Shared schemas
   packages/tsconfig - Shared TS config

💡 Run specific app:
   bun run dev --filter=api
`);

  printFormatHint(packageManager);
}

/**
 * 在现有 monorepo 中创建新的 app
 */
async function createInExistingMonorepo(
  monorepoRoot: string,
  workspaces: string[],
  packageManager: string,
  runtime: "Bun" | "Node.js"
) {
  // 获取现有的 workspaces
  const ws = await getMonorepoWorkspaces(monorepoRoot, workspaces);

  // 询问创建位置
  const location = await askMonorepoLocation(
    monorepoRoot,
    ws.apps,
    ws.packages
  );

  divider();

  // 生成 app 文件
  await task("Creating new app in monorepo...", async ({ setTitle }) => {
    step(`Writing ${location.locationType}/${location.projectName}...`);

    const appDir = location.fullPath;

    // 创建目录
    await createOrFindDir(joinPath(appDir, "src"));

    // package.json
    await writeFile(
      joinPath(appDir, "package.json"),
      getMonorepoNewAppPackageJson(location.projectName)
    );

    // server.ts
    await writeFile(
      joinPath(appDir, "src/server.ts"),
      getMonorepoAppServer(location.projectName)
    );

    // tsconfig.json
    await writeFile(
      joinPath(appDir, "tsconfig.json"),
      getMonorepoAppTsConfig()
    );

    // biome.json
    await writeFile(
      joinPath(appDir, "biome.json"),
      getMonorepoAppBiomeConfig()
    );

    // .gitignore
    await writeFile(
      joinPath(appDir, ".gitignore"),
      getMonorepoAppGitignore()
    );

    // README.md
    await writeFile(
      joinPath(appDir, "README.md"),
      getMonorepoAppReadme(location.projectName)
    );

    setTitle(`✅ App ${location.projectName} created!`);
  });

  // 完成提示
  divider();
  success(`🎉 App created in monorepo!`);
  divider();

  const relativePath = path.relative(monorepoRoot, location.fullPath);
  console.log(`
📁 App location: ${relativePath}

🚀 Next steps:
   cd ${relativePath}
   bun run dev

💡 Run from monorepo root:
   bun run dev --filter=${location.projectName}
`);

  printFormatHint(packageManager);
}

/**
 * 创建 Standalone 项目（原有逻辑）
 */
async function createStandaloneProject(
  dir: string,
  packageManager: string,
  runtime: "Bun" | "Node.js",
  args: Record<string, unknown>
) {
  const projectDir = resolvePath(dir);
  const projectName = path.basename(projectDir);

  // 创建项目目录
  await createOrFindDir(projectDir);

  // 4.1 项目类型选择
  const { isMonorepo } = await askProjectType();

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
  preferences.packageManager = packageManager as "bun";
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
  await checkAndClearDirectory(projectDir, projectName);

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

/**
 * 检查目录是否为空，如果不为空则询问是否覆盖
 */
async function checkAndClearDirectory(
  projectDir: string,
  projectName: string
) {
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
}
