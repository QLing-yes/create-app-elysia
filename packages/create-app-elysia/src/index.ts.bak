#!/usr/bin/env node
// 导入必要的模块
import fs from "node:fs/promises";
import path from "node:path";
import { prompt } from "enquirer";
import minimist from "minimist";
import task from "tasuku";
import dedent from "ts-dedent";
// 导入模板生成函数
import {
	generateEslintConfig,
	getConfigFile,
	getDBIndex,
	getDrizzleConfig,
	getElysiaIndex,
	getEnvFile,
	getIndex,
	getInstallCommands,
	getPackageJson,
	getReadme,
	getTSConfig,
} from "./templates";
import { getBotFile } from "./templates/bot";
// 导入 Docker 相关模板
import {
	getDevelopmentDockerCompose,
	getDockerCompose,
	getDockerfile,
} from "./templates/docker";
// 导入服务相关模板
import { getAuthPlugin } from "./templates/services/auth";
import { getJobifyFile } from "./templates/services/jobify";
import { getLocksFile } from "./templates/services/locks";
import { getPosthogIndex } from "./templates/services/posthog";
import { getRedisFile } from "./templates/services/redis";
import { getS3ServiceFile } from "./templates/services/s3";
// 导入测试相关模板
import {
	getPreloadFile,
	getTestSharedFile,
	getTestsAPIFile,
	getTestsIndex,
} from "./templates/tests";
import { getVSCodeExtensions, getVSCodeSettings } from "./templates/vscode";
// 导入工具函数和类型
import {
	Preferences,
	type PreferencesType,
	createOrFindDir,
	detectPackageManager,
	exec,
} from "./utils";

const preferences = new Preferences();

// 解析命令行参数
const args = minimist(process.argv.slice(2));

// 检测包管理器，目前仅支持 Bun
const packageManager = args.pm || detectPackageManager();
if (packageManager !== "bun") throw new Error("Now supported only bun");

// 获取项目目录名
const dir = args._.at(0);
if (!dir)
	throw new Error(
		"Specify the folder like this - bun create elysiajs dir-name",
	);
const projectDir = path.resolve(`${process.cwd()}/`, dir);

// 处理未捕获的 Promise 拒绝
process.on("unhandledRejection", async (error) => {
	const filesInTargetDirectory = await fs.readdir(projectDir);
	if (filesInTargetDirectory.length) {
		console.log(error);
		const { overwrite } = await prompt<{ overwrite: boolean }>({
			type: "toggle",
			name: "overwrite",
			initial: "yes",
			message: `You exit the process. Do you want to delete the directory ${path.basename(projectDir)}?`,
		});
		if (!overwrite) {
			console.log("Cancelled...");
			return process.exit(0);
		}
	}
	console.log("Template deleted...");
	console.error(error);
	await fs.rm(projectDir, { recursive: true });
	process.exit(0);
});

// 创建项目目录并开始模板生成流程
createOrFindDir(projectDir)
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.then(async () => {
		// 设置基本偏好配置
		preferences.dir = dir;
		preferences.projectName = path.basename(projectDir);
		preferences.packageManager = packageManager;
		preferences.isMonorepo = !!args.monorepo;
		preferences.runtime = packageManager === "bun" ? "Bun" : "Node.js";

		// 是否跳过安装依赖
		// biome-ignore lint/complexity/noExtraBooleanCast: <explanation>
		preferences.noInstall = !Boolean(args.install ?? true);

		// 检查目录是否为空，如果不为空则询问是否覆盖
		const filesInTargetDirectory = await fs.readdir(projectDir);
		if (filesInTargetDirectory.length) {
			const { overwrite } = await prompt<{ overwrite: boolean }>({
				type: "toggle",
				name: "overwrite",
				initial: "yes",
				message: `\n${filesInTargetDirectory.join(
					"\n",
				)}\n\nThe directory ${preferences.projectName} is not empty. Do you want to delete the files?`,
			});
			if (!overwrite) {
				console.log("Cancelled...");
				return process.exit(0);
			}

			await fs.rm(projectDir, { recursive: true });
			await fs.mkdir(projectDir);
		}

		// 非单仓库模式下，询问用户配置选项
		if (!args.monorepo) {
			// 询问是否与 Telegram 相关
			const { telegramRelated } = await prompt<{
				telegramRelated: PreferencesType["telegramRelated"];
			}>({
				type: "toggle",
				name: "telegramRelated",
				initial: "no",
				message:
					"Is your project related to Telegram (Did you wants to validate init data and etc)?",
			});
			preferences.telegramRelated = telegramRelated;

			// 选择代码检查工具
			const { linter } = await prompt<{ linter: PreferencesType["linter"] }>({
				type: "select",
				name: "linter",
				message: "Select linters/formatters:",
				choices: ["None", "ESLint", "Biome"],
			});
			preferences.linter = linter;

			// 选择 ORM/查询构建器
			const { orm } = await prompt<{ orm: PreferencesType["orm"] }>({
				type: "select",
				name: "orm",
				message: "Select ORM/Query Builder:",
				choices: ["None", "Prisma", "Drizzle"],
			});
			preferences.orm = orm;
			// 如果选择 Prisma，询问数据库类型
			if (orm === "Prisma") {
				const { database } = await prompt<{
					database: PreferencesType["database"];
				}>({
					type: "select",
					name: "database",
					message: "Select DataBase for Prisma:",
					choices: [
						"PostgreSQL",
						"MySQL",
						"MongoDB",
						"SQLite",
						"SQLServer",
						"CockroachDB",
					],
				});
				preferences.database = database;
			}
			// 如果选择 Drizzle，询问数据库类型和驱动
			if (orm === "Drizzle") {
				const { database } = await prompt<{
					database: "PostgreSQL" | "MySQL" | "SQLite";
				}>({
					type: "select",
					name: "database",
					message: "Select DataBase for Drizzle:",
					choices: ["PostgreSQL", "MySQL", "SQLite"],
				});
				const driversMap: Record<typeof database, PreferencesType["driver"][]> =
					{
						PostgreSQL: (
							[
								preferences.runtime === "Bun" ? "Bun.sql" : undefined,
								"node-postgres",
								"Postgres.JS",
							] as const
						).filter((x) => x !== undefined),
						MySQL: ["MySQL 2"],
						SQLite: ["Bun SQLite"],
					};

				const { driver } = await prompt<{ driver: PreferencesType["driver"] }>({
					type: "select",
					name: "driver",
					message: `Select driver for ${database}:`,
					choices: driversMap[database],
				});
				preferences.database = database;
				preferences.driver = driver;

				// 如果选择 PostgreSQL，询问是否使用 PGLite 模拟测试
				if (database === "PostgreSQL") {
					const { mockWithPGLite } = await prompt<{
						mockWithPGLite: PreferencesType["mockWithPGLite"];
					}>({
						type: "toggle",
						name: "mockWithPGLite",
						initial: "yes",
						message:
							"Do you want to mock database in tests with PGLite (Postgres in WASM)?",
					});
					preferences.mockWithPGLite = mockWithPGLite;
				}
			}
		} else {
			// 单仓库模式下默认配置
			preferences.telegramRelated = true;
		}
		// 选择 Elysia 插件
		const { plugins } = await prompt<{
			plugins: PreferencesType["plugins"];
		}>({
			type: "multiselect",
			name: "plugins",
			message: "Select Elysia plugins: (Space to select, Enter to continue)",
			choices: [
				"CORS",
				"Swagger",
				"JWT",
				"Autoload",
				"Oauth 2.0",
				// "Logger",
				"HTML/JSX",
				"Static",
				"Bearer",
				"Server Timing",
			] as PreferencesType["plugins"],
		});
		preferences.plugins = plugins;
		// 非单仓库模式下，询问其他工具
		if (!args.monorepo) {
			const { others } = await prompt<{ others: PreferencesType["others"] }>({
				type: "multiselect",
				name: "others",
				message: "Select others tools: (Space to select, Enter to continue)",
				choices: ["S3", "Posthog", "Jobify", "Husky"],
			});
			preferences.others = others;

			// 如果选择 S3，询问 S3 客户端类型
			if (others.includes("S3")) {
				const { s3Client } = await prompt<{
					s3Client: PreferencesType["s3Client"];
				}>({
					type: "select",
					name: "s3Client",
					message: "Select S3 client:",
					choices: ["Bun.S3Client", "@aws-sdk/client-s3"],
				});
				preferences.s3Client = s3Client;
			}

			// 如果没有选择 Husky，询问是否创建 Git 仓库
			if (!others.includes("Husky")) {
				const { git } = await prompt<{ git: boolean }>({
					type: "toggle",
					name: "git",
					initial: "yes",
					message: "Create an empty Git repository?",
				});
				preferences.git = git;
			} else preferences.git = true;

			// 询问是否使用 Locks 防止竞态条件
			const { locks } = await prompt<{ locks: boolean }>({
				type: "toggle",
				name: "locks",
				initial: "yes",
				message: "Do you want to use Locks to prevent race conditions?",
			});

			preferences.locks = locks;

			// 如果选择了 Jobify，自动启用 Redis
			if (others.includes("Jobify")) {
				preferences.redis = true;
			} else {
				// 否则询问是否使用 Redis
				const { redis } = await prompt<{ redis: boolean }>({
					type: "toggle",
					name: "redis",
					initial: "yes",
					message: "Do you want to use Redis?",
				});

				preferences.redis = redis;
			}

			// 询问是否创建 Docker 配置
			const { docker } = await prompt<{ docker: boolean }>({
				type: "toggle",
				name: "docker",
				initial: "yes",
				message: "Create Dockerfile + docker.compose.yml?",
			});

			preferences.docker = docker;

			// 询问是否创建 VSCode 配置
			const { vscode } = await prompt<{ vscode: boolean }>({
				type: "toggle",
				name: "vscode",
				initial: "yes",
				message:
					"Create .vscode folder with VSCode extensions recommendations and settings?",
			});

			preferences.vscode = vscode;
		}

		// 开始生成模板文件
		await task("Generating a template...", async ({ setTitle }) => {
			// 如果选择了 Static 插件，创建 public 目录
			if (plugins.includes("Static")) await fs.mkdir(projectDir + "/public");

			// 如果选择 ESLint，生成配置文件
			if (preferences.linter === "ESLint")
				await fs.writeFile(
					`${projectDir}/eslint.config.mjs`,
					generateEslintConfig(preferences),
				);

			// 生成基础配置文件
			await fs.writeFile(
				projectDir + "/package.json",
				getPackageJson(preferences),
			);
			await fs.writeFile(
				projectDir + "/tsconfig.json",
				getTSConfig(preferences),
			);
			await fs.writeFile(projectDir + "/.env", getEnvFile(preferences));
			await fs.writeFile(
				projectDir + "/.env.production",
				getEnvFile(preferences, true),
			);
			await fs.writeFile(projectDir + "/README.md", getReadme(preferences));
			await fs.writeFile(
				projectDir + "/.gitignore",
				["dist", "node_modules", ".env", ".env.production"].join("\n"),
			);
			// 创建 src 目录并生成核心文件
			await fs.mkdir(projectDir + "/src");
			await fs.writeFile(
				projectDir + "/src/server.ts",
				getElysiaIndex(preferences),
			);
			await fs.writeFile(projectDir + "/src/index.ts", getIndex(preferences));
			await fs.writeFile(
				`${projectDir}/src/config.ts`,
				getConfigFile(preferences),
			);

			// 创建路由目录（为 Autoload 插件准备）
			// if (plugins.includes("Autoload"))
			await fs.mkdir(projectDir + "/src/routes");

			// 如果选择了 ORM，创建数据库相关文件
			if (preferences.orm !== "None") {
				await fs.mkdir(projectDir + "/src/db");
				await fs.writeFile(
					projectDir + "/src/db/index.ts",
					getDBIndex(preferences),
				);

				// 如果选择 Drizzle，生成迁移配置和 schema 文件
				if (preferences.orm === "Drizzle") {
					await fs.writeFile(
						projectDir + "/drizzle.config.ts",
						getDrizzleConfig(preferences),
					);
					await fs.writeFile(
						projectDir + "/src/db/schema.ts",
						preferences.database === "PostgreSQL"
							? `// import { pgTable } from "drizzle-orm/pg-core"`
							: preferences.database === "MySQL"
								? `// import { mysqlTable } from "drizzle-orm/mysql-core"`
								: `// import { sqliteTable } from "drizzle-orm/sqlite-core"`,
					);
					// 如果选择 SQLite，创建数据库文件
					if (preferences.database === "SQLite")
						await fs.writeFile(projectDir + "/sqlite.db", "");
				}
			}

			// 创建服务目录
			await fs.mkdir(projectDir + "/src/services");

			// 如果选择 Posthog，生成分析服务
			if (preferences.others.includes("Posthog")) {
				await fs.writeFile(
					`${projectDir}/src/services/posthog.ts`,
					getPosthogIndex(),
				);
			}

			// 如果选择 Jobify，生成任务队列服务
			if (preferences.others.includes("Jobify")) {
				await fs.writeFile(
					`${projectDir}/src/services/jobify.ts`,
					getJobifyFile(),
				);
				await fs.mkdir(projectDir + "/src/jobs");
			}

			// 如果选择 Redis，生成 Redis 服务
			if (preferences.redis) {
				await fs.writeFile(
					`${projectDir}/src/services/redis.ts`,
					getRedisFile(),
				);
			}

			// 如果选择 Locks，生成锁服务
			if (preferences.locks) {
				await fs.writeFile(
					`${projectDir}/src/services/locks.ts`,
					getLocksFile(preferences),
				);
			}

			// 如果选择 S3，生成 S3 服务
			if (preferences.s3Client !== "None") {
				await fs.writeFile(
					`${projectDir}/src/services/s3.ts`,
					getS3ServiceFile(preferences),
				);
			}

			// 如果与 Telegram 相关，生成认证插件
			if (preferences.telegramRelated) {
				await fs.writeFile(
					`${projectDir}/src/services/auth.plugin.ts`,
					getAuthPlugin(),
				);
			}
			// 如果选择 Docker，生成 Docker 配置文件
			if (preferences.docker) {
				await fs.writeFile(
					`${projectDir}/Dockerfile`,
					getDockerfile(preferences),
				);
				await fs.writeFile(
					`${projectDir}/docker-compose.dev.yml`,
					getDevelopmentDockerCompose(preferences),
				);
				await fs.writeFile(
					`${projectDir}/docker-compose.yml`,
					getDockerCompose(preferences),
				);
			}

			// 如果选择 VSCode，生成编辑器配置
			if (preferences.vscode) {
				await fs.mkdir(`${projectDir}/.vscode`);
				await fs.writeFile(
					`${projectDir}/.vscode/settings.json`,
					getVSCodeSettings(preferences),
				);
				await fs.writeFile(
					`${projectDir}/.vscode/extensions.json`,
					getVSCodeExtensions(preferences),
				);
			}

			// 如果选择使用 PGLite 模拟测试，生成测试文件
			if (preferences.mockWithPGLite) {
				await fs.mkdir(projectDir + "/tests");
				await fs.writeFile(
					`${projectDir}/tests/preload.ts`,
					getPreloadFile(preferences),
				);
				await fs.writeFile(
					`${projectDir}/tests/api.ts`,
					getTestsAPIFile(preferences),
				);
				await fs.mkdir(`${projectDir}/tests/e2e`);
				await fs.writeFile(
					`${projectDir}/tests/e2e/index.test.ts`,
					getTestsIndex(preferences),
				);

				// 生成 Bun 测试配置文件
				await fs.writeFile(
					`${projectDir}/bunfig.toml`,
					dedent /* toml */`[test]
						preload = ["./tests/preload.ts"]
					`,
				);

				// 如果与 Telegram 相关，生成共享测试工具
				if (preferences.telegramRelated)
					await fs.writeFile(
						`${projectDir}/tests/shared.ts`,
						getTestSharedFile(),
					);
			}

			// 如果与 Telegram 相关且不是单仓库模式，生成 Bot 文件
			if (preferences.telegramRelated && !preferences.isMonorepo)
				await fs.writeFile(`${projectDir}/src/bot.ts`, getBotFile());

			setTitle("Template generation is complete!");
		});

		// 生成并执行安装命令
		const commands = getInstallCommands(preferences);

		for await (const command of commands) {
			await task(command, async () => {
				await exec(command, {
					cwd: projectDir,
				}).catch((e) => console.error(e));
			});
		}
	});
