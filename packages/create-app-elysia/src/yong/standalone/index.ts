/**
 * 用 Standalone - 独立项目创建编排
 * 调共享 prompts + 共享 ti 生成文件
 */

import path from "node:path";
import fs from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import enquirer from "enquirer-esm";
import task from "tasuku";
const { prompt } = enquirer;
const execAsync = promisify(exec);

import {
  Preferences,
  createOrFindDir,
  writeFile,
  resolvePath,
  joinPath,
  info,
  success,
  title,
  divider,
  step,
} from "../../utils";
import * as ti from "../../ti";
import {
  askDatabase,
  askPlugins,
  askIntegrations,
  askDevTools,
  askFormatter,
} from "../../prompts";

export async function createStandalone(
  dir: string,
  packageManager: string,
  args: Record<string, unknown>,
) {
  const projectDir = resolvePath(dir);
  const projectName = path.basename(projectDir);
  const runtime = packageManager === "bun" ? "Bun" : "Node.js";

  title("🚀 Create Elysia App");
  divider();
  step("正在收集配置...");

  // 漏斗式提问
  const dbConfig = await askDatabase(false, runtime);
  const { plugins } = await askPlugins();
  const integrations = await askIntegrations(false);
  const devTools = await askDevTools(false);
  const { formatter } = await askFormatter(false);

  // 组装 Preferences
  const prefs = new Preferences();
  prefs.dir = dir;
  prefs.projectName = projectName;
  prefs.packageManager = packageManager as "bun";
  prefs.runtime = runtime;
  prefs.orm = dbConfig.orm;
  prefs.database = dbConfig.database ?? "PostgreSQL";
  prefs.driver = dbConfig.driver ?? "None";
  prefs.mockWithPGLite = dbConfig.mockWithPGLite ?? false;
  prefs.plugins = plugins ?? [];
  prefs.others = integrations.others;
  prefs.s3Client = integrations.s3Client ?? "None";
  prefs.redis = integrations.redis;
  prefs.locks = integrations.locks;
  prefs.telegramRelated = integrations.telegramRelated;
  prefs.docker = devTools.docker;
  prefs.vscode = devTools.vscode;
  prefs.git = devTools.git;
  prefs.husky = devTools.husky;
  prefs.formatter = formatter;
  prefs.noInstall = !Boolean(args.install ?? true);

  // 检查目录
  await checkAndClearDirectory(projectDir, projectName);

  divider();

  // 生成文件
  await task("正在生成项目文件...", async ({ setTitle }) => {
    // 基础文件
    step("正在写入基础文件...");
    await writeFile(joinPath(projectDir, "package.json"), ti.getPackageJson(prefs));
    await writeFile(joinPath(projectDir, "tsconfig.json"), ti.getTSConfig(prefs));
    await writeFile(joinPath(projectDir, ".gitignore"), ti.getGitIgnore());
    await writeFile(joinPath(projectDir, "README.md"), ti.getReadme(prefs));
    await writeFile(joinPath(projectDir, ".env"), ti.getEnvFile(prefs));
    await writeFile(joinPath(projectDir, ".env.production"), ti.getEnvFile(prefs, true));

    // 核心文件
    step("正在写入核心文件...");
    await createOrFindDir(joinPath(projectDir, "src"));
    await writeFile(joinPath(projectDir, "src/server.ts"), ti.getElysiaIndex(prefs));
    await writeFile(joinPath(projectDir, "src/index.ts"), ti.getIndex(prefs));
    await writeFile(joinPath(projectDir, "src/config.ts"), ti.getConfigFile(prefs));
    await createOrFindDir(joinPath(projectDir, "src/routes"));

    // 数据库
    if (prefs.orm !== "None") {
      step("正在写入数据库文件...");
      await createOrFindDir(joinPath(projectDir, "src/db"));
      await writeFile(joinPath(projectDir, "src/db/index.ts"), ti.getDBIndex(prefs));

      if (prefs.orm === "Drizzle") {
        await writeFile(joinPath(projectDir, "drizzle.config.ts"), ti.getDrizzleConfig(prefs));

        const schemaContent =
          prefs.database === "PostgreSQL"
            ? `// import { pgTable } from "drizzle-orm/pg-core"`
            : prefs.database === "MySQL"
              ? `// import { mysqlTable } from "drizzle-orm/mysql-core"`
              : `// import { sqliteTable } from "drizzle-orm/sqlite-core"`;
        await writeFile(joinPath(projectDir, "src/db/schema.ts"), schemaContent);

        if (prefs.database === "SQLite") {
          await writeFile(joinPath(projectDir, "sqlite.db"), "");
        }
      }
    }

    // 服务层
    await createOrFindDir(joinPath(projectDir, "src/services"));

    if (prefs.others.includes("Posthog")) {
      await writeFile(joinPath(projectDir, "src/services/posthog.ts"), ti.getPosthogIndex());
    }
    if (prefs.others.includes("Jobify")) {
      await writeFile(joinPath(projectDir, "src/services/jobify.ts"), ti.getJobifyFile());
      await createOrFindDir(joinPath(projectDir, "src/jobs"));
    }
    if (prefs.redis) {
      await writeFile(joinPath(projectDir, "src/services/redis.ts"), ti.getRedisFile());
    }
    if (prefs.locks) {
      await writeFile(joinPath(projectDir, "src/services/locks.ts"), ti.getLocksFile(prefs));
    }
    if (prefs.s3Client !== "None") {
      await writeFile(joinPath(projectDir, "src/services/s3.ts"), ti.getS3ServiceFile(prefs));
    }
    if (prefs.telegramRelated) {
      await writeFile(joinPath(projectDir, "src/services/auth.plugin.ts"), ti.getAuthPlugin());
    }

    // 开发工具
    if (prefs.formatter === "eslint" || prefs.formatter === "biome") {
      step("正在写入格式化配置...");
      if (prefs.formatter === "eslint") {
        await writeFile(joinPath(projectDir, "eslint.config.mjs"), ti.generateEslintConfig(prefs));
      }
      if (prefs.formatter === "biome") {
        await writeFile(
          joinPath(projectDir, "biome.json"),
          JSON.stringify(
            {
              $schema: "https://biomejs.dev/schemas/2.2.3/schema.json",
              formatter: { enabled: true, indentStyle: "space", indentWidth: 2 },
              linter: { enabled: true, rules: { recommended: true } },
            },
            null,
            2,
          ),
        );
      }
    }

    if (prefs.docker) {
      await writeFile(joinPath(projectDir, "Dockerfile"), ti.getDockerfile(prefs));
      await writeFile(joinPath(projectDir, "docker-compose.dev.yml"), ti.getDevelopmentDockerCompose(prefs));
      await writeFile(joinPath(projectDir, "docker-compose.yml"), ti.getDockerCompose(prefs));
    }
    if (prefs.vscode) {
      await createOrFindDir(joinPath(projectDir, ".vscode"));
      await writeFile(joinPath(projectDir, ".vscode/settings.json"), ti.getVSCodeSettings(prefs));
      await writeFile(joinPath(projectDir, ".vscode/extensions.json"), ti.getVSCodeExtensions(prefs));
    }

    // 测试
    if (prefs.mockWithPGLite) {
      step("正在写入测试文件...");
      await createOrFindDir(joinPath(projectDir, "tests"));
      await writeFile(joinPath(projectDir, "tests/preload.ts"), ti.getPreloadFile(prefs));
      await writeFile(joinPath(projectDir, "tests/api.ts"), ti.getTestsAPIFile());
      await createOrFindDir(joinPath(projectDir, "tests/e2e"));
      await writeFile(joinPath(projectDir, "tests/e2e/index.test.ts"), ti.getTestsIndex());

      await writeFile(
        joinPath(projectDir, "bunfig.toml"),
        `[test]\npreload = ["./tests/preload.ts"]\n`,
      );

      if (prefs.telegramRelated) {
        await writeFile(joinPath(projectDir, "tests/shared.ts"), ti.getTestSharedFile());
      }
    }

    // Telegram Bot
    if (prefs.telegramRelated) {
      await writeFile(joinPath(projectDir, "src/bot.ts"), ti.getBotFile());
    }

    setTitle("✅ 模板生成完成！");
  });

  // 安装依赖
  if (!prefs.noInstall) {
    const commands = ti.getInstallCommands(prefs);
    for (const command of commands) {
      await task(command, async () => {
        await execAsync(command, { cwd: projectDir }).catch((e) => console.error(e));
      });
    }
  }

  // 完成提示
  divider();
  success("🎉 项目创建成功！");
  divider();

  const lines: string[] = [];
  lines.push(`📁 项目位置：${projectDir}`);
  lines.push("");
  lines.push("🚀 下一步：");
  lines.push(`   cd ${dir}`);
  lines.push("   bun dev");
  lines.push("");

  if (prefs.plugins.length > 0) {
    const pluginPackages = prefs.plugins
      .map((p) => {
        const name = p.toLowerCase().replace(/\s+/g, "-");
        if (name === "oauth-2.0") return "@elysiajs/oauth2";
        if (name === "html/jsx") return "@elysiajs/html";
        if (name === "server-timing") return "@elysiajs/server-timing";
        return `@elysiajs/${name}`;
      })
      .join(" \\\n    ");
    lines.push("📦 安装已选 Elysia 插件：");
    lines.push(`   bun add ${pluginPackages}`);
    lines.push("");
  }

  if (prefs.formatter === "ultracite") {
    lines.push("💡 格式化代码（ultracite）：");
    lines.push("   npx ultracite init");
    lines.push("   npx ultracite fix");
  } else if (prefs.formatter === "biome") {
    lines.push("💡 格式化代码（Biome）：");
    lines.push("   bun run lint:fix");
  } else if (prefs.formatter === "eslint") {
    lines.push("💡 格式化代码（ESLint）：");
    lines.push("   bun run lint:fix");
  }

  console.log(lines.join("\n"));
}

async function checkAndClearDirectory(projectDir: string, projectName: string) {
  const filesInTargetDirectory = await fs.readdir(projectDir).catch(() => []);
  if (filesInTargetDirectory.length) {
    const { overwrite } = await prompt<{ overwrite: boolean }>({
      type: "toggle",
      name: "overwrite",
      message: `\n${filesInTargetDirectory.join("\n")}\n\n目录 ${projectName} 不为空，是否删除这些文件？`,
      initial: true,
    });

    if (!overwrite) {
      info("已取消...");
      process.exit(0);
    }

    await fs.rm(projectDir, { recursive: true });
    await createOrFindDir(projectDir);
  }
}
