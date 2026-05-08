#!/usr/bin/env node
/**
 * 入口：轻量路由
 * 检测 monorepo 环境 → 路由到对应的用
 *
 * 检测到 monorepo → 直接添加 app
 * 未检测到 → 询问项目类型 → standalone / 新 monorepo
 */

import minimist from "minimist";
import { error, title, divider, detectPackageManager } from "./utils";
import { detectMonorepo } from "./utils/monorepo-detector";
import { askProjectType } from "./prompts/00-monorepo-detect";
import { createStandalone, createNewMonorepo, addAppToMonorepo, createDDProject } from "./yong";

process.on("unhandledRejection", async (err) => {
  console.error(err);
  error("检测到未处理的 Promise 拒绝，进程将终止。");
  process.exit(1);
});

async function main() {
  const args = minimist(process.argv.slice(2));
  const dir = args._.at(0);

  if (!dir) {
    throw new Error("请指定项目目录，例如：bun create elysiajs 项目名");
  }

  const packageManager = args.pm || detectPackageManager();
  if (packageManager !== "bun") {
    throw new Error("当前仅支持 Bun");
  }

  const monorepoResult = await detectMonorepo(process.cwd());

  title("🚀 Create Elysia App");
  divider();

  if (monorepoResult.isMonorepo && monorepoResult.rootPath) {
    // 在现有 monorepo 中添加 app
    await addAppToMonorepo(monorepoResult.rootPath, monorepoResult.workspaces, packageManager);
  } else {
    // 未检测到 monorepo，询问项目类型
    const projectType = await askProjectType();
    if (projectType === "monorepo") {
      await createNewMonorepo(dir, packageManager, args);
    } else if (projectType === "dd") {
      await createDDProject(dir, packageManager, args);
    } else {
      await createStandalone(dir, packageManager, args);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
