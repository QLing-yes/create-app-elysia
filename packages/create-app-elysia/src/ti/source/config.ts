/**
 * 体 - 配置文件 (src/config.ts)
 */

import { dedent } from "ts-dedent";
import type { Preferences } from "../../utils";

export function getConfigFile({
	orm,
	redis,
	others,
	plugins,
	locks,
	telegramRelated,
}: Preferences): string {
	const envs: string[] = [];

	envs.push(`PORT: env.get("PORT").default(3000).asPortNumber()`);
	envs.push(
		`API_URL: env.get("API_URL").default(\`https://\${env.get("PUBLIC_DOMAIN").asString()}\`).asString()`,
	);

	if (telegramRelated) {
		envs.push(`BOT_TOKEN: env.get("BOT_TOKEN").required().asString()`);
	}
	if (orm !== "None")
		envs.push(`DATABASE_URL: env.get("DATABASE_URL").required().asString()`);
	if (redis) {
		envs.push(`REDIS_HOST: env.get("REDIS_HOST").default("localhost").asString()`);
	}
	if (others.includes("Posthog")) {
		envs.push(`POSTHOG_API_KEY: env.get("POSTHOG_API_KEY").default("it's a secret").asString()`);
		envs.push(`POSTHOG_HOST: env.get("POSTHOG_HOST").default("localhost").asString()`);
	}
	if (others.includes("S3")) {
		envs.push(`S3_ENDPOINT: env.get("S3_ENDPOINT").default("localhost").asString()`);
		envs.push(`S3_ACCESS_KEY_ID: env.get("S3_ACCESS_KEY_ID").default("minio").asString()`);
		envs.push(`S3_SECRET_ACCESS_KEY: env.get("S3_SECRET_ACCESS_KEY").default("minio").asString()`);
	}
	if (locks) {
		const stores = ["memory"];
		if (redis) stores.push("redis");
		envs.push(
			`LOCK_STORE: env.get("LOCK_STORE").default("memory").asEnum(${JSON.stringify(stores)})`,
		);
	}
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
