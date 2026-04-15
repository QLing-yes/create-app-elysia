/**
 * 步骤 4: 询问集成工具选择
 * Redis, S3, Posthog, Jobify 等第三方服务
 */

import enquirer from 'enquirer';
const { prompt } = enquirer; 
import type { PreferencesType } from "../utils";

export interface IntegrationsResult {
  others: PreferencesType["others"];
  s3Client?: PreferencesType["s3Client"];
  redis: PreferencesType["redis"];
  locks: PreferencesType["locks"];
  telegramRelated: PreferencesType["telegramRelated"];
}

/**
 * 询问用户选择集成工具
 * 
 * @param isMonorepo 是否为单仓库模式（Monorepo 精简配置）
 * @returns 集成工具选择结果
 */
export async function askIntegrations(
  isMonorepo: boolean
): Promise<IntegrationsResult> {
  // Monorepo 模式：精简配置
  if (isMonorepo) {
    // 只询问 Telegram 相关
    const { telegramRelated } = await prompt<{
      telegramRelated: PreferencesType["telegramRelated"];
    }>({
      type: "toggle",
      name: "telegramRelated",
      message: "Is your project related to Telegram?",
      initial: false,
    });

    return {
      others: [],
      redis: false,
      locks: false,
      telegramRelated,
    };
  }

  // Standalone 模式：完整配置
  
  // 询问 Telegram 相关
  const { telegramRelated } = await prompt<{
    telegramRelated: PreferencesType["telegramRelated"];
  }>({
    type: "toggle",
    name: "telegramRelated",
    message:
      "Is your project related to Telegram (Did you wants to validate init data and etc)?",
    initial: false,
  });

  // 询问其他集成工具
  const { others } = await prompt<{ others: PreferencesType["others"] }>({
    type: "multiselect",
    name: "others",
    message: "Select others tools: (Space to select, Enter to continue)",
    choices: ["S3", "Posthog", "Jobify", "Husky"],
  });

  // S3 客户端选择
  let s3Client: PreferencesType["s3Client"] = "None";
  if (others.includes("S3")) {
    const { s3Client: client } = await prompt<{
      s3Client: PreferencesType["s3Client"];
    }>({
      type: "select",
      name: "s3Client",
      message: "Select S3 client:",
      choices: ["Bun.S3Client", "@aws-sdk/client-s3"],
    });
    s3Client = client;
  }

  // Redis 配置（Jobify 自动启用 Redis）
  let redis: PreferencesType["redis"] = false;
  if (others.includes("Jobify")) {
    redis = true;
  } else {
    const { redis: r } = await prompt<{ redis: PreferencesType["redis"] }>({
      type: "toggle",
      name: "redis",
      message: "Do you want to use Redis?",
      initial: true,
    });
    redis = r;
  }

  // Locks 配置
  const { locks } = await prompt<{ locks: PreferencesType["locks"] }>({
    type: "toggle",
    name: "locks",
    message: "Do you want to use Locks to prevent race conditions?",
    initial: true,
  });

  return {
    others,
    s3Client,
    redis,
    locks,
    telegramRelated,
  };
}
