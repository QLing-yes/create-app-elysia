/**
 * 步骤 3: 集成工具选择
 * Telegram, S3, Posthog, Jobify, Redis, Locks
 */

import enquirer from "enquirer-esm";
const { prompt } = enquirer;
import type { PreferencesType } from "../utils";

export interface IntegrationsResult {
  others: PreferencesType["others"];
  s3Client?: PreferencesType["s3Client"];
  redis: boolean;
  locks: boolean;
  telegramRelated: boolean;
}

export async function askIntegrations(isMonorepo: boolean): Promise<IntegrationsResult> {
  if (isMonorepo) {
    const { telegramRelated } = await prompt<{ telegramRelated: boolean }>({
      type: "toggle",
      name: "telegramRelated",
      message: "项目是否与 Telegram 相关？",
      initial: false,
    });

    return { others: [], redis: false, locks: false, telegramRelated };
  }

  // Telegram
  const { telegramRelated } = await prompt<{ telegramRelated: boolean }>({
    type: "toggle",
    name: "telegramRelated",
    message: "项目是否与 Telegram 相关（需要验证 initData 等）？",
    initial: false,
  });

  // 集成工具多选（Husky 已移到 dev-tools）
  const { others } = await prompt<{ others: PreferencesType["others"] }>({
    type: "multiselect",
    name: "others",
    message: "选择集成工具：（空格选择，回车确认）",
    choices: ["S3", "Posthog", "Jobify"],
  });

  // S3 客户端
  let s3Client: PreferencesType["s3Client"] = "None";
  if (others.includes("S3")) {
    const result = await prompt<{ s3Client: PreferencesType["s3Client"] }>({
      type: "select",
      name: "s3Client",
      message: "选择 S3 客户端：",
      choices: ["Bun.S3Client", "@aws-sdk/client-s3"],
    });
    s3Client = result.s3Client;
  }

  // Redis（Jobify 自动启用）
  let redis = false;
  if (others.includes("Jobify")) {
    redis = true;
  } else {
    const result = await prompt<{ redis: boolean }>({
      type: "toggle",
      name: "redis",
      message: "是否使用 Redis？",
      initial: true,
    });
    redis = result.redis;
  }

  // Locks（只有开启 Redis 才问）
  let locks = false;
  if (redis) {
    const result = await prompt<{ locks: boolean }>({
      type: "toggle",
      name: "locks",
      message: "是否使用分布式锁（防止竞态条件）？",
      initial: true,
    });
    locks = result.locks;
  }

  return { others, s3Client, redis, locks, telegramRelated };
}
