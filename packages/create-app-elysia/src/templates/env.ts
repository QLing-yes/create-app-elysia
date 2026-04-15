import { randomBytes } from "node:crypto";
import dedent from "ts-dedent";
import type { Preferences, PreferencesType } from "../utils.js";

// 数据库连接 URL 示例映射
const connectionURLExamples: Record<
	InstanceType<typeof Preferences>["database"],
	string
> = {
	PostgreSQL: "postgresql://root:mypassword@localhost:5432/mydb",
	MySQL: "mysql://root:mypassword@localhost:3306/mydb",
	SQLServer:
		"sqlserver://localhost:1433;database=mydb;user=root;password=mypassword;",
	CockroachDB:
		"postgresql://root:mypassword@localhost:26257/mydb?schema=public",
	MongoDB:
		"mongodb+srv://root:mypassword@cluster0.ab1cd.mongodb.net/mydb?retryWrites=true&w=majority",
	SQLite: "file:./sqlite.db",
};

// Docker Compose 服务名称映射
const composeServiceNames: Record<
	InstanceType<typeof Preferences>["database"],
	string
> = {
	PostgreSQL: "postgres",
	MySQL: "localhost",
	SQLServer: "localhost",
	CockroachDB: "localhost",
	MongoDB: "localhost",
	SQLite: "file:./sqlite.db",
};

/**
 * 生成环境变量文件 (.env)
 * @param preferences 用户偏好配置
 * @param isComposed 是否为 Docker Compose 环境
 */
export function getEnvFile(
	{
		database,
		orm,
		plugins,
		projectName,
		redis,
		meta,
		telegramRelated,
	}: PreferencesType,
	isComposed = false,
) {
	const envs = [];

	// 如果配置了 ORM，生成数据库连接 URL
	if (orm !== "None") {
		let url = connectionURLExamples[database]
			.replace("mydb", projectName)
			.replace("root", projectName)
			.replace("mypassword", meta.databasePassword);

		// 在 Docker Compose 环境下，使用服务名称代替 localhost
		if (isComposed)
			url = url.replace("localhost", composeServiceNames[database]);

		envs.push(`DATABASE_URL="${url}"`);
	}

	// 如果与 Telegram 相关，添加 Bot Token
	if (telegramRelated) {
		envs.push(`BOT_TOKEN=""`);
	}

	// 在 Docker Compose 环境下且使用 Redis，设置 Redis 主机
	if (isComposed && redis) envs.push("REDIS_HOST=redis");

	// 如果选择 JWT 插件，生成密钥
	if (plugins.includes("JWT"))
		envs.push(`JWT_SECRET="${randomBytes(12).toString("hex")}"`);

	// 添加端口配置
	envs.push("PORT=3000");
	return envs.join("\n");
}

/**
 * 生成配置文件 (src/config.ts)
 * 使用 env-var 库进行环境变量验证和类型转换
 */
export function getConfigFile({
	orm,
	redis,
	others,
	plugins,
	locks,
	telegramRelated,
}: PreferencesType) {
	const envs: string[] = [];

	// 基础配置
	envs.push(`PORT: env.get("PORT").default(3000).asPortNumber()`);
	// envs.push(`PUBLIC_DOMAIN: env.get("PUBLIC_DOMAIN").asString()`);
	envs.push(
		`API_URL: env.get("API_URL").default(\`https://\${env.get("PUBLIC_DOMAIN").asString()}\`).asString()`,
	);

	// Telegram 相关配置
	if (telegramRelated) {
		envs.push(`BOT_TOKEN: env.get("BOT_TOKEN").required().asString()`);
	}

	// 数据库配置
	if (orm !== "None")
		envs.push(`DATABASE_URL: env.get("DATABASE_URL").required().asString()`);

	// Redis 配置
	if (redis) {
		envs.push(
			`REDIS_HOST: env.get("REDIS_HOST").default("localhost").asString()`,
		);
	}

	// Posthog 分析配置
	if (others.includes("Posthog")) {
		envs.push(
			`POSTHOG_API_KEY: env.get("POSTHOG_API_KEY").default("it's a secret").asString()`,
		);
		envs.push(
			`POSTHOG_HOST: env.get("POSTHOG_HOST").default("localhost").asString()`,
		);
	}

	// S3 存储配置
	if (others.includes("S3")) {
		envs.push(
			`S3_ENDPOINT: env.get("S3_ENDPOINT").default("localhost").asString()`,
		);
		envs.push(
			`S3_ACCESS_KEY_ID: env.get("S3_ACCESS_KEY_ID").default("minio").asString()`,
		);
		envs.push(
			`S3_SECRET_ACCESS_KEY: env.get("S3_SECRET_ACCESS_KEY").default("minio").asString()`,
		);
	}

	// 锁配置
	if (locks) {
		const stores = ["memory"];
		if (redis) stores.push("redis");

		envs.push(
			`LOCK_STORE: env.get("LOCK_STORE").default("memory").asEnum(${JSON.stringify(stores)})`,
		);
	}

	// JWT 配置
	if (plugins.includes("JWT"))
		envs.push(`JWT_SECRET: env.get("JWT_SECRET").required().asString()`);

	return dedent /* ts */`
	import env from "env-var";

	export const config = {
		NODE_ENV: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["production", "test", "development"]),


		${envs.join(",\n")}
	}`;
}
