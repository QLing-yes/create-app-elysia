/**
 * 用 Standalone - 完整漏斗交互
 * Standalone 模式调用所有 prompt（无 isMonorepo 精简）
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;
import type { Preferences } from "../../utils";

export interface StandalonePromptsResult {
	orm: Preferences["orm"];
	database: Preferences["database"];
	driver: Preferences["driver"];
	mockWithPGLite: boolean;
	plugins: Preferences["plugins"];
	others: Preferences["others"];
	s3Client: Preferences["s3Client"];
	redis: boolean;
	locks: boolean;
	telegramRelated: boolean;
	linter: Preferences["linter"];
	docker: boolean;
	vscode: boolean;
	git: boolean;
}

export async function runStandalonePrompts(
	runtime: "Bun" | "Node.js",
): Promise<StandalonePromptsResult> {
	// ---- 数据库配置 ----
	const { orm } = await prompt<{ orm: Preferences["orm"] }>({
		type: "select",
		name: "orm",
		message: "选择 ORM/查询构建器：",
		choices: ["None", "Prisma", "Drizzle"],
	});

	let database: Preferences["database"] = "PostgreSQL";
	let driver: Preferences["driver"] = "None";
	let mockWithPGLite = false;

	if (orm === "Prisma") {
		const dbResult = await prompt<{ database: Preferences["database"] }>({
			type: "select",
			name: "database",
			message: "为 Prisma 选择数据库：",
			choices: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "SQLServer", "CockroachDB"],
		});
		database = dbResult.database;
	}

	if (orm === "Drizzle") {
		const dbResult = await prompt<{ database: "PostgreSQL" | "MySQL" | "SQLite" }>({
			type: "select",
			name: "database",
			message: "为 Drizzle 选择数据库：",
			choices: ["PostgreSQL", "MySQL", "SQLite"],
		});
		database = dbResult.database;

		const driversMap: Record<string, string[]> = {
			PostgreSQL: [runtime === "Bun" ? "Bun.sql" : undefined, "node-postgres", "Postgres.JS"].filter(
				(x): x is string => x !== undefined,
			),
			MySQL: ["MySQL 2"],
			SQLite: ["Bun SQLite"],
		};

		const driverResult = await prompt<{ driver: string }>({
			type: "select",
			name: "driver",
			message: `为 ${database} 选择驱动：`,
			choices: driversMap[database],
		});
		driver = driverResult.driver as Preferences["driver"];

		if (database === "PostgreSQL") {
			const mockResult = await prompt<{ mockWithPGLite: boolean }>({
				type: "toggle",
				name: "mockWithPGLite",
				message: "是否在测试中使用 PGLite 模拟数据库？",
				initial: true,
			});
			mockWithPGLite = mockResult.mockWithPGLite;
		}
	}

	// ---- Elysia 插件 ----
	const { plugins } = await prompt<{ plugins: Preferences["plugins"] }>({
		type: "multiselect",
		name: "plugins",
		message: "选择 Elysia 插件：（空格选择，回车确认）",
		choices: ["CORS", "Swagger", "JWT", "Autoload", "Oauth 2.0", "HTML/JSX", "Static", "Bearer", "Server Timing"],
	});

	// ---- 集成工具 ----
	const { telegramRelated } = await prompt<{ telegramRelated: boolean }>({
		type: "toggle",
		name: "telegramRelated",
		message: "项目是否与 Telegram 相关？",
		initial: false,
	});

	const { others } = await prompt<{ others: string[] }>({
		type: "multiselect",
		name: "others",
		message: "选择其他工具：（空格选择，回车确认）",
		choices: ["S3", "Posthog", "Jobify", "Husky"],
	});

	let s3Client: Preferences["s3Client"] = "None";
	if (others.includes("S3")) {
		const s3Result = await prompt<{ s3Client: string }>({
			type: "select",
			name: "s3Client",
			message: "选择 S3 客户端：",
			choices: ["Bun.S3Client", "@aws-sdk/client-s3"],
		});
		s3Client = s3Result.s3Client as Preferences["s3Client"];
	}

	let redis = false;
	if (others.includes("Jobify")) {
		redis = true;
	} else {
		const redisResult = await prompt<{ redis: boolean }>({
			type: "toggle",
			name: "redis",
			message: "是否使用 Redis？",
			initial: true,
		});
		redis = redisResult.redis;
	}

	const { locks } = await prompt<{ locks: boolean }>({
		type: "toggle",
		name: "locks",
		message: "是否使用分布式锁（防止竞态条件）？",
		initial: true,
	});

	// ---- 开发工具 ----
	const { linter } = await prompt<{ linter: Preferences["linter"] }>({
		type: "select",
		name: "linter",
		message: "选择代码检查/格式化工具：",
		choices: ["None", "ESLint", "Biome"],
	});

	const { docker } = await prompt<{ docker: boolean }>({
		type: "toggle",
		name: "docker",
		message: "是否创建 Dockerfile + docker-compose.yml？",
		initial: true,
	});

	const { vscode } = await prompt<{ vscode: boolean }>({
		type: "toggle",
		name: "vscode",
		message: "是否创建 .vscode 配置文件夹？",
		initial: true,
	});

	let git = true;
	if (!others.includes("Husky")) {
		const gitResult = await prompt<{ git: boolean }>({
			type: "toggle",
			name: "git",
			message: "是否初始化 Git 仓库？",
			initial: true,
		});
		git = gitResult.git;
	}

	return {
		orm: orm ?? "None",
		database,
		driver,
		mockWithPGLite,
		plugins: plugins ?? [],
		others: (others ?? []) as Preferences["others"],
		s3Client,
		redis,
		locks,
		telegramRelated,
		linter: linter ?? "None",
		docker,
		vscode,
		git,
	};
}
