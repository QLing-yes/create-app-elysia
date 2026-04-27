/**
 * 用 Standalone - 独立项目创建编排
 * 调用体 (ti) 生成项目文件，不包含 isMonorepo 判断
 */

import path from "node:path";
import fs from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import enquirer from "enquirer";
import task from "tasuku";
const { prompt } = enquirer;
const execAsync = promisify(exec);

import { Preferences, createOrFindDir, writeFile, resolvePath, joinPath, info, success, error, title, divider, step } from "../../utils";
import * as ti from "../../ti";
import { runStandalonePrompts } from "./prompts";

export async function createStandalone(
	dir: string,
	packageManager: string,
	args: Record<string, unknown>,
) {
	const projectDir = resolvePath(dir);
	const projectName = path.basename(projectDir);

	// 漏斗式交互
	title("🚀 Create Elysia App");
	divider();
	step("Collecting preferences...");

	const prompts = await runStandalonePrompts(packageManager === "bun" ? "Bun" : "Node.js");

	// 组装 Preferences
	const prefs = new Preferences();
	prefs.dir = dir;
	prefs.projectName = projectName;
	prefs.packageManager = packageManager as "bun";
	prefs.runtime = packageManager === "bun" ? "Bun" : "Node.js";
	prefs.orm = prompts.orm;
	prefs.database = prompts.database;
	prefs.driver = prompts.driver;
	prefs.mockWithPGLite = prompts.mockWithPGLite;
	prefs.plugins = prompts.plugins;
	prefs.others = prompts.others;
	prefs.s3Client = prompts.s3Client;
	prefs.redis = prompts.redis;
	prefs.locks = prompts.locks;
	prefs.telegramRelated = prompts.telegramRelated;
	prefs.linter = prompts.linter;
	prefs.docker = prompts.docker;
	prefs.vscode = prompts.vscode;
	prefs.git = prompts.git;
	prefs.noInstall = !Boolean(args.install ?? true);

	// 检查目录
	await checkAndClearDirectory(projectDir, projectName);

	divider();

	// 生成文件
	await task("Generating project files...", async ({ setTitle }) => {
		// 基础文件
		step("Writing base files...");
		await writeFile(joinPath(projectDir, "package.json"), ti.getPackageJson(prefs));
		await writeFile(joinPath(projectDir, "tsconfig.json"), ti.getTSConfig(prefs));
		await writeFile(joinPath(projectDir, ".gitignore"), ti.getGitIgnore());
		await writeFile(joinPath(projectDir, "README.md"), ti.getReadme(prefs));
		await writeFile(joinPath(projectDir, ".env"), ti.getEnvFile(prefs));
		await writeFile(joinPath(projectDir, ".env.production"), ti.getEnvFile(prefs, true));

		// 核心文件
		step("Writing core files...");
		await createOrFindDir(joinPath(projectDir, "src"));
		await writeFile(joinPath(projectDir, "src/server.ts"), ti.getElysiaIndex(prefs));
		await writeFile(joinPath(projectDir, "src/index.ts"), ti.getIndex(prefs));
		await writeFile(joinPath(projectDir, "src/config.ts"), ti.getConfigFile(prefs));
		await createOrFindDir(joinPath(projectDir, "src/routes"));

		// 数据库
		if (prefs.orm !== "None") {
			step("Writing database files...");
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
		if (prefs.linter === "ESLint") {
			await writeFile(joinPath(projectDir, "eslint.config.mjs"), ti.generateEslintConfig(prefs));
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
			step("Writing test files...");
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

		setTitle("✅ Template generation is complete!");
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
	success("🎉 Project created successfully!");
	divider();
	console.log(`
📁 Project location: ${projectDir}

🚀 Next steps:
   cd ${dir}
   bun dev

💡 Tip: To format your code:
   bun run lint:fix
   npx ultracite init
   npx ultracite fix
`);
	printFormatHint(packageManager);
}

async function checkAndClearDirectory(projectDir: string, projectName: string) {
	const filesInTargetDirectory = await fs.readdir(projectDir).catch(() => []);
	if (filesInTargetDirectory.length) {
		const { overwrite } = await prompt<{ overwrite: boolean }>({
			type: "toggle",
			name: "overwrite",
			message: `\n${filesInTargetDirectory.join("\n")}\n\nThe directory ${projectName} is not empty. Do you want to delete the files?`,
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

function printFormatHint(packageManager: string) {
	console.log(`
💡 Tip: To format your code, run one of the following commands:

   ${packageManager} run lint:fix

   Or with ultracite:
   npx ultracite init
   npx ultracite fix
`);
}
