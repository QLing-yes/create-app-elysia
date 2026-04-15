import dedent from "ts-dedent";
import type { PreferencesType } from "../../utils";

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
}: PreferencesType): string {
  const envs: string[] = [];

  // 基础配置
  envs.push(`PORT: env.get("PORT").default(3000).asPortNumber()`);
  envs.push(
    `API_URL: env.get("API_URL").default(\`https://\${env.get("PUBLIC_DOMAIN").asString()}\`).asString()`
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
      `REDIS_HOST: env.get("REDIS_HOST").default("localhost").asString()`
    );
  }

  // Posthog 分析配置
  if (others.includes("Posthog")) {
    envs.push(
      `POSTHOG_API_KEY: env.get("POSTHOG_API_KEY").default("it's a secret").asString()`
    );
    envs.push(
      `POSTHOG_HOST: env.get("POSTHOG_HOST").default("localhost").asString()`
    );
  }

  // S3 存储配置
  if (others.includes("S3")) {
    envs.push(
      `S3_ENDPOINT: env.get("S3_ENDPOINT").default("localhost").asString()`
    );
    envs.push(
      `S3_ACCESS_KEY_ID: env.get("S3_ACCESS_KEY_ID").default("minio").asString()`
    );
    envs.push(
      `S3_SECRET_ACCESS_KEY: env.get("S3_SECRET_ACCESS_KEY").default("minio").asString()`
    );
  }

  // 锁配置
  if (locks) {
    const stores = ["memory"];
    if (redis) stores.push("redis");

    envs.push(
      `LOCK_STORE: env.get("LOCK_STORE").default("memory").asEnum(${JSON.stringify(stores)})`
    );
  }

  // JWT 配置
  if (plugins.includes("JWT"))
    envs.push(`JWT_SECRET: env.get("JWT_SECRET").required().asString()`);

  return dedent /* ts */ `
  import env from "env-var";

  export const config = {
    NODE_ENV: env
      .get("NODE_ENV")
      .default("development")
      .asEnum(["production", "test", "development"]),

    ${envs.join(",\n")}
  }`;
}
