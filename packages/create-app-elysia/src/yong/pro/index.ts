/**
 * 用 Pro - Pro 专业版项目创建编排
 * 调共享 prompts + 共享 ti + 私有模板生成文件
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
  askProFeatures,
} from "../../prompts";
import * as tpl from "./templates";

export async function createProProject(
  dir: string,
  packageManager: string,
  args: Record<string, unknown>,
) {
  const projectDir = resolvePath(dir);
  const projectName = path.basename(projectDir);

  title("🚀 Create Elysia Pro 专业版项目");
  divider();
  step("正在收集配置...");

  // 漏斗式提问
  const dbConfig = await askDatabase(false, "Bun");
  const { plugins } = await askPlugins();
  const integrations = await askIntegrations(false);
  const devTools = await askDevTools(false);
  const { formatter } = await askFormatter(false);
  const { clusterEnabled, withMenu } = await askProFeatures();

  // 组装 Preferences
  const prefs = new Preferences();
  prefs.dir = dir;
  prefs.projectName = projectName;
  prefs.packageManager = packageManager as "bun";
  prefs.runtime = "Bun";
  prefs.orm = dbConfig.orm;
  prefs.database = dbConfig.database ?? "PostgreSQL";
  prefs.driver = dbConfig.driver ?? "None";
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
  prefs.clusterEnabled = clusterEnabled;
  prefs.withMenu = withMenu;
  prefs.noInstall = !Boolean(args.install ?? true);

  // 检查目录
  await checkAndClearDirectory(projectDir, projectName);

  divider();

  // 生成文件
  await task("正在生成项目文件...", async ({ setTitle }) => {
    // 基础文件
    step("正在写入基础文件...");
    await writeFile(joinPath(projectDir, "package.json"), tpl.getProPackageJson(prefs));
    await writeFile(joinPath(projectDir, "tsconfig.json"), tpl.getProTsConfig());
    await writeFile(joinPath(projectDir, ".gitignore"), tpl.getProGitignore());
    await writeFile(joinPath(projectDir, "README.md"), tpl.getProReadme(projectName));
    await writeFile(joinPath(projectDir, ".env"), tpl.getProEnv(prefs));
    await writeFile(joinPath(projectDir, "bunfig.toml"), tpl.getProBunfig());
    await writeFile(joinPath(projectDir, "biome.jsonc"), tpl.getBiomeJson());
    await writeFile(joinPath(projectDir, "drizzle.config.ts"), tpl.getDrizzleConfig());

    // Core app files
    step("正在写入核心文件...");
    await createOrFindDir(joinPath(projectDir, "app"));
    await writeFile(joinPath(projectDir, "app/index.ts"), tpl.getAppIndex());

    // Cluster mode
    if (prefs.clusterEnabled) {
      await writeFile(joinPath(projectDir, "app/cluster.ts"), tpl.getClusterFile());
    }

    // Common
    await createOrFindDir(joinPath(projectDir, "app/common"));
    await writeFile(joinPath(projectDir, "app/common/index.ts"), tpl.getCommonIndex());
    await writeFile(joinPath(projectDir, "app/common/schemas.ts"), tpl.getSchemas());
    await writeFile(joinPath(projectDir, "app/common/schemaDerive.ts"), tpl.getSchemaDerive());

    // Lib
    await createOrFindDir(joinPath(projectDir, "app/lib"));
    await writeFile(joinPath(projectDir, "app/lib/drizzle.ts"), tpl.getDrizzleLib(prefs));
    await writeFile(joinPath(projectDir, "app/lib/logger.ts"), tpl.getLogger());
    await writeFile(joinPath(projectDir, "app/lib/error.ts"), tpl.getErrorLib());

    if (prefs.redis) {
      await writeFile(joinPath(projectDir, "app/lib/redis.ts"), tpl.getRedisLib());
    }

    // Plugins
    await createOrFindDir(joinPath(projectDir, "app/plugins"));
    await writeFile(joinPath(projectDir, "app/plugins/index.plug.ts"), tpl.getIndexPlug(prefs));
    await writeFile(joinPath(projectDir, "app/plugins/controller.plug.ts"), tpl.getControllerPlug());
    await writeFile(joinPath(projectDir, "app/plugins/macro.plug.ts"), tpl.getMacroPlug());
    await writeFile(joinPath(projectDir, "app/plugins/schemas.plug.ts"), tpl.getSchemasPlug());

    // Models
    await createOrFindDir(joinPath(projectDir, "app/model"));
    await writeFile(joinPath(projectDir, "app/model/post.mold.ts"), tpl.getPostMold());
    await writeFile(joinPath(projectDir, "app/model/user.mold.ts"), tpl.getUserMold());

    // Controllers
    await createOrFindDir(joinPath(projectDir, "app/controller"));
    await writeFile(joinPath(projectDir, "app/controller/test.ctrl.ts"), tpl.getTestCtrl());
    await createOrFindDir(joinPath(projectDir, "app/controller/test"));
    await writeFile(joinPath(projectDir, "app/controller/test/test.ctrl.ts"), tpl.getTestSubCtrl());
    await createOrFindDir(joinPath(projectDir, "app/controller/test/testsub"));
    await writeFile(
      joinPath(projectDir, "app/controller/test/testsub/test.ctrl.ts"),
      tpl.getTestSubSubCtrl(),
    );

    // Utils
    await createOrFindDir(joinPath(projectDir, "app/utils"));
    await writeFile(joinPath(projectDir, "app/utils/file.ts"), tpl.getFileUtils());
    await writeFile(joinPath(projectDir, "app/utils/watch.ts"), tpl.getWatchUtil());

    if (prefs.withMenu) {
      await writeFile(joinPath(projectDir, "app/utils/menu-ui.ts"), tpl.getMenuUI());
    }

    // Support scripts
    await createOrFindDir(joinPath(projectDir, "support/script"));
    await writeFile(joinPath(projectDir, "support/script/index.ts"), tpl.getScriptIndex());
    await writeFile(joinPath(projectDir, "support/script/routes.ts"), tpl.getRoutesGen());
    await writeFile(joinPath(projectDir, "support/script/batchExport.ts"), tpl.getBatchExport());

    if (prefs.withMenu) {
      await writeFile(joinPath(projectDir, "support/script/menu.ts"), tpl.getMenuScript());
    }

    // Types
    await createOrFindDir(joinPath(projectDir, "support/types"));
    await writeFile(joinPath(projectDir, "support/types/global.d.ts"), tpl.getGlobalTypes());

    // Test
    await createOrFindDir(joinPath(projectDir, "test"));
    await writeFile(joinPath(projectDir, "test/client.ts"), tpl.getTestClient());

    // Public
    await createOrFindDir(joinPath(projectDir, "public"));
    await writeFile(joinPath(projectDir, "public/.gitkeep"), "");

    setTitle("✅ Pro 专业版模板生成完成！");
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
  success("🎉 Pro 专业版项目创建成功！");
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
    lines.push("   bun run fix");
  } else if (prefs.formatter === "eslint") {
    lines.push("💡 格式化代码（ESLint）：");
    lines.push("   bun run lint:fix");
  }

  lines.push("");
  lines.push("🧩 Pro 项目特性：");
  lines.push("   - 自动路由（app/controller/**/*.ctrl.ts）");
  lines.push("   - 全局 $g 注入（db, redis, logger, ctrl, success, error）");
  lines.push("   - 标准响应格式 { msg, code, data }");
  lines.push("   - 模型约定（.mold.ts → table + relations + schema）");
  if (prefs.clusterEnabled) {
    lines.push("   - 集群模式（多进程 + 熔断器）");
  }
  if (prefs.withMenu) {
    lines.push("   - CLI 交互菜单（bun menu）");
  }
  lines.push("   - 代码生成（bun generate）");

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
