// 导入必要的 Node.js 模块
import child_process from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import { promisify } from "node:util";

// 定义包管理器类型
export type PackageManager = "bun" | "npm" | "yarn" | "pnpm";

// 获取当前 Node.js 主版本号
const nodeMajorVersion = process?.versions?.node?.split(".")[0];

// 如果 Node.js 版本低于 22，发出警告
if (nodeMajorVersion && Number(nodeMajorVersion) < 22)
	console.warn(
		`Node.js version ${process?.versions?.node} is not recommended for this template. Please upgrade to Node.js 22 or higher.`,
	);

/**
 * 检测当前使用的包管理器
 * @returns 包管理器名称
 */
export function detectPackageManager() {
	const userAgent = process.env.npm_config_user_agent;

	if (!userAgent)
		throw new Error(
			`Package manager was not detected. Please specify template with "--pm bun"`,
		);

	return userAgent.split(" ")[0].split("/")[0] as PackageManager;
}

/**
 * 创建目录或查找现有目录
 * @param path 目录路径
 */
export async function createOrFindDir(path: string) {
	await fs.stat(path).catch(async () => fs.mkdir(path));
}

/**
 * 用户偏好配置类
 * 用于存储项目生成的所有配置选项
 */
export class Preferences {
	projectName = "";
	dir = "";
	packageManager: PackageManager = "bun";
	runtime: "Bun" | "Node.js" = "Bun";
	linter: "ESLint" | "Biome" | "None" = "None";
	orm: "Prisma" | "Drizzle" | "None" = "None";
	database:
		| "PostgreSQL"
		| "MySQL"
		| "MongoDB"
		| "SQLite"
		| "SQLServer"
		| "CockroachDB" = "PostgreSQL";
	driver:
		| "node-postgres"
		| "Bun.sql"
		| "Postgres.JS"
		| "MySQL 2"
		| "Bun SQLite"
		| "None" = "None";
	git = true;
	others: ("S3" | "Husky" | "Posthog" | "Jobify")[] = [];
	plugins: (
		| "JWT"
		| "CORS"
		| "Swagger"
		| "Autoload"
		| "Oauth 2.0"
		| "Logger"
		| "HTML/JSX"
		| "Static"
		| "Bearer"
		| "Server Timing"
	)[] = [];
	// 是否与 create-gramio 集成
	isMonorepo = false;

	docker = false;
	vscode = false;
	redis = false;
	locks = false;
	s3Client: "Bun.S3Client" | "@aws-sdk/client-s3" | "None" = "None";
	meta: {
		databasePassword: string;
	} = {
		databasePassword: randomBytes(12).toString("hex"),
	};

	noInstall = false;

	mockWithPGLite = false;

	telegramRelated = false;
}

// Preferences 类的实例类型
export type PreferencesType = InstanceType<typeof Preferences>;

// 将 child_process.exec 转换为 Promise 版本
export const exec = promisify(child_process.exec);

/**
 * 包管理器执行命令映射（用于 npx/yarn dlx 等）
 */
export const pmExecuteMap: Record<PackageManager, string> = {
	npm: "npx",
	bun: "bun x",
	yarn: "yarn dlx",
	pnpm: "pnpm dlx",
};

/**
 * 包管理器运行脚本映射（用于 npm run/yarn 等）
 */
export const pmRunMap: Record<PackageManager, string> = {
	npm: "npm run",
	bun: "bun",
	yarn: "yarn",
	pnpm: "pnpm",
};

/**
 * 包管理器单仓库过滤命令映射
 */
export const pmFilterMonorepoMap: Record<PackageManager, string | false> = {
	npm: false,
	yarn: false,
	bun: "bun --filter 'apps/*'",
	pnpm: "pnpm --filter 'apps/*'",
};

/**
 * 包管理器锁文件映射
 */
export const pmLockFilesMap: Record<PackageManager, string> = {
	npm: "package.lock.json",
	bun: "bun.lock",
	yarn: "yarn.lock",
	pnpm: "pnpm-lock.yaml",
};

/**
 * 包管理器冻结锁文件安装命令（开发环境）
 */
export const pmInstallFrozenLockfile: Record<PackageManager, string> = {
	npm: "npm ci",
	bun: "bun install --frozen-lockfile",
	yarn: "yarn install --frozen-lockfile",
	pnpm: "pnpm install --frozen-lockfile",
};

/**
 * 包管理器冻结锁文件安装命令（生产环境）
 */
export const pmInstallFrozenLockfileProduction: Record<PackageManager, string> =
	{
		npm: "npm ci --production",
		bun: "bun install --frozen-lockfile --production",
		yarn: "yarn install --frozen-lockfile --production",
		pnpm: "pnpm install --frozen-lockfile --prod",
	};
