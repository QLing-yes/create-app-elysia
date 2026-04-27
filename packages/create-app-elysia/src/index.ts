#!/usr/bin/env node
/**
 * 入口：轻量路由
 * 仅负责解析参数、检测环境、路由到对应的用
 */

// import minimist from "minimist";
var minimist = require('minimist')
import { error, title, divider } from "./utils";
import { detectPackageManager } from "./utils";
import { detectMonorepo } from "./utils/monorepo-detector";
import { askMonorepoContext } from "./prompts/00-monorepo-detect";
import { createStandalone, createNewMonorepo, addAppToMonorepo } from "./yong";

process.on("unhandledRejection", async (err) => {
	console.error(err);
	error("Unhandled rejection detected. The process will be terminated.");
	process.exit(1);
});

async function main() {
	const args = minimist(process.argv.slice(2));
	const dir = args._.at(0);

	if (!dir) {
		throw new Error("Specify the folder like this - bun create elysiajs dir-name");
	}

	const packageManager = args.pm || detectPackageManager();
	if (packageManager !== "bun") {
		throw new Error("Currently only Bun is supported");
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
