#!/usr/bin/env node
/**
 * 入口：轻量路由
 * 仅负责解析参数、检测环境、路由到对应的用
 */

import minimist from "minimist";
import { error, title, divider } from "./utils";
import { detectPackageManager } from "./utils";
import { detectMonorepo } from "./utils/monorepo-detector";
import { askMonorepoContext } from "./prompts/00-monorepo-detect";
import { createStandalone, createNewMonorepo, addAppToMonorepo } from "./yong";

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

	// 检测 monorepo 环境并获取上下文
	const monorepoResult = await detectMonorepo(process.cwd());

	title("🚀 Create Elysia App");
	divider();

	const monorepoContext = await askMonorepoContext(
		monorepoResult.isMonorepo,
		monorepoResult.rootPath,
	);

	// 路由到对应的用
	if (monorepoContext.isMonorepo && !monorepoContext.createNewMonorepo && monorepoContext.monorepoRoot) {
		await addAppToMonorepo(
			monorepoContext.monorepoRoot,
			monorepoResult.workspaces,
			packageManager,
		);
	} else if (monorepoContext.isMonorepo && monorepoContext.createNewMonorepo) {
		await createNewMonorepo(dir, packageManager, args);
	} else {
		await createStandalone(dir, packageManager, args);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
