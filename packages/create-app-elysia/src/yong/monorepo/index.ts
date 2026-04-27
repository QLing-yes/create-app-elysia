/**
 * 用 Monorepo - Monorepo 项目创建编排
 */

import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import enquirer from "enquirer-esm";
import task from "tasuku";
const { prompt } = enquirer;
const execAsync = promisify(exec);

import { createOrFindDir, writeFile, resolvePath, joinPath, info, success, title, divider, step } from "../../utils";
import { getMonorepoWorkspaces } from "../../utils/monorepo-detector";
import { askMonorepoName, askMonorepoLocation } from "../../prompts/00-monorepo-detect";

// import monorepo templates
import {
	getMonorepoRootPackageJson,
	getTurboJson,
	getMonorepoRootTsConfig,
	getMonorepoGitignore,
	getMonorepoReadme,
	getContractIndex,
	getContractPackageJson,
	getTsConfigPackage,
	getBaseTsConfig,
} from "./templates";

import {
	getMonorepoNewAppPackageJson,
	getMonorepoAppServer,
	getMonorepoAppTsConfig,
	getMonorepoAppBiomeConfig,
	getMonorepoAppGitignore,
	getMonorepoAppReadme,
} from "./templates";

/**
 * 创建新 Monorepo
 */
export async function createNewMonorepo(
	dir: string,
	packageManager: string,
	args: Record<string, unknown>,
) {
	const projectDir = resolvePath(dir);
	const projectName = path.basename(projectDir);
	const monorepoName = await askMonorepoName();

	await checkAndClearDirectory(projectDir, projectName);
	divider();

	await task("正在生成 Monorepo 结构...", async ({ setTitle }) => {
		step("正在写入根目录文件...");
		await writeFile(joinPath(projectDir, "package.json"), getMonorepoRootPackageJson(monorepoName));
		await writeFile(joinPath(projectDir, "turbo.json"), getTurboJson());
		await writeFile(joinPath(projectDir, "tsconfig.json"), getMonorepoRootTsConfig());
		await writeFile(joinPath(projectDir, ".gitignore"), getMonorepoGitignore());
		await writeFile(joinPath(projectDir, "README.md"), getMonorepoReadme(monorepoName));

		// biome.json
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

		// packages/contract
		step("正在写入 packages/contract...");
		const contractDir = joinPath(projectDir, "packages", "contract", "src");
		await createOrFindDir(contractDir);
		await writeFile(joinPath(projectDir, "packages/contract/package.json"), getContractPackageJson());
		await writeFile(joinPath(projectDir, "packages/contract/src/index.ts"), getContractIndex());
		await writeFile(
			joinPath(projectDir, "packages/contract/tsconfig.json"),
			JSON.stringify(
				{ extends: "@repo/tsconfig/base.json", compilerOptions: { module: "ESNext", moduleResolution: "bundler", noEmit: true, skipLibCheck: true }, include: ["src/**/*"], exclude: ["node_modules", "dist"] },
				null,
				2,
			),
		);

		// packages/tsconfig
		step("正在写入 packages/tsconfig...");
		const tsconfigDir = joinPath(projectDir, "packages", "tsconfig");
		await createOrFindDir(tsconfigDir);
		await writeFile(joinPath(projectDir, "packages/tsconfig/package.json"), getTsConfigPackage());
		await writeFile(joinPath(projectDir, "packages/tsconfig/base.json"), getBaseTsConfig());

		// apps/api
		step("正在写入 apps/api...");
		const apiDir = joinPath(projectDir, "apps", "api", "src");
		await createOrFindDir(apiDir);
		await writeFile(joinPath(projectDir, "apps/api/package.json"), getMonorepoNewAppPackageJson("api"));
		await writeFile(joinPath(projectDir, "apps/api/src/server.ts"), getMonorepoAppServer("api"));
		await writeFile(joinPath(projectDir, "apps/api/tsconfig.json"), getMonorepoAppTsConfig());
		await writeFile(joinPath(projectDir, "apps/api/biome.json"), getMonorepoAppBiomeConfig());
		await writeFile(joinPath(projectDir, "apps/api/.gitignore"), getMonorepoAppGitignore());
		await writeFile(joinPath(projectDir, "apps/api/README.md"), getMonorepoAppReadme("api"));

		setTitle("✅ Monorepo 结构生成完成！");
	});

	const noInstall = !Boolean(args.install ?? true);
	if (!noInstall) {
		await task("正在安装依赖...", async () => {
			await execAsync("bun install", { cwd: projectDir }).catch((e) => console.error(e));
		});
	}

	divider();
	success("🎉 Monorepo 创建成功！");
	divider();
	console.log(`
	📁 项目位置：${projectDir}

	🚀 下一步：
	   cd ${dir}
	   bun run dev

	📦 结构：
	   apps/api/         - Elysia 后端
	   packages/contract - 共享 Schema
	   packages/tsconfig - 共享 TS 配置

	💡 运行特定应用：
	   bun run dev --filter=api
	`);
}

/**
 * 在现有 monorepo 中添加新 app
 */
export async function addAppToMonorepo(
	monorepoRoot: string,
	workspaces: string[],
	packageManager: string,
) {
	const ws = await getMonorepoWorkspaces(monorepoRoot, workspaces);
	const location = await askMonorepoLocation(monorepoRoot, ws.apps, ws.packages);
	divider();

	await task("正在 Monorepo 中创建新应用...", async ({ setTitle }) => {
		step(`正在写入 ${location.locationType}/${location.projectName}...`);
		const appDir = location.fullPath;
		await createOrFindDir(joinPath(appDir, "src"));

		await writeFile(joinPath(appDir, "package.json"), getMonorepoNewAppPackageJson(location.projectName));
		await writeFile(joinPath(appDir, "src/server.ts"), getMonorepoAppServer(location.projectName));
		await writeFile(joinPath(appDir, "tsconfig.json"), getMonorepoAppTsConfig());
		await writeFile(joinPath(appDir, "biome.json"), getMonorepoAppBiomeConfig());
		await writeFile(joinPath(appDir, ".gitignore"), getMonorepoAppGitignore());
		await writeFile(joinPath(appDir, "README.md"), getMonorepoAppReadme(location.projectName));

		setTitle(`✅ 应用 ${location.projectName} 创建成功！`);
	});

	divider();
	success(`🎉 应用创建成功！`);
	divider();

	const relativePath = path.relative(monorepoRoot, location.fullPath);
	console.log(`
	📁 应用位置：${relativePath}

	🚀 下一步：
	   cd ${relativePath}
	   bun run dev

	💡 从 Monorepo 根目录运行：
	   bun run dev --filter=${location.projectName}
	`);
}

async function checkAndClearDirectory(projectDir: string, projectName: string) {
	const fs = await import("node:fs/promises");
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
