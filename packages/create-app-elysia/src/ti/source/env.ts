/**
 * 体 - 环境变量文件 (.env)
 */

import { randomBytes } from "node:crypto";
import type { Preferences } from "../../utils";
import type { DatabaseType } from "../../types";

const connectionURLExamples: Record<DatabaseType, string> = {
	PostgreSQL: "postgresql://root:mypassword@localhost:5432/mydb",
	MySQL: "mysql://root:mypassword@localhost:3306/mydb",
	SQLServer: "sqlserver://localhost:1433;database=mydb;user=root;password=mypassword;",
	CockroachDB: "postgresql://root:mypassword@localhost:26257/mydb?schema=public",
	MongoDB: "mongodb+srv://root:mypassword@cluster0.ab1cd.mongodb.net/mydb?retryWrites=true&w=majority",
	SQLite: "file:./sqlite.db",
};

const composeServiceNames: Record<DatabaseType, string> = {
	PostgreSQL: "postgres",
	MySQL: "localhost",
	SQLServer: "localhost",
	CockroachDB: "localhost",
	MongoDB: "localhost",
	SQLite: "file:./sqlite.db",
};

export function getEnvFile(
	{
		database,
		orm,
		plugins,
		projectName,
		redis,
		meta,
		telegramRelated,
	}: Preferences,
	isComposed = false,
) {
	const envs: string[] = [];

	if (orm !== "None") {
		let url = connectionURLExamples[database]
			.replace("mydb", projectName)
			.replace("root", projectName)
			.replace("mypassword", meta.databasePassword);

		if (isComposed)
			url = url.replace("localhost", composeServiceNames[database]);

		envs.push(`DATABASE_URL="${url}"`);
	}

	if (telegramRelated) {
		envs.push(`BOT_TOKEN=""`);
	}

	if (isComposed && redis) envs.push("REDIS_HOST=redis");

	if (plugins.includes("JWT"))
		envs.push(`JWT_SECRET="${randomBytes(12).toString("hex")}"`);

	envs.push("PORT=3000");
	return envs.join("\n");
}
