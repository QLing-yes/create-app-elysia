/**
 * 用户偏好配置类
 * 存储项目生成的所有配置选项
 */

import { randomBytes } from "node:crypto";
import type {
  PackageManager,
  DatabaseType,
  DrizzleDriver,
  ORMType,
  LinterType,
  ElysiaPlugin,
  IntegrationTool,
  S3ClientType,
} from "../types";

/**
 * 用户偏好配置类
 * 
 * 使用示例：
 * ```ts
 * const preferences = new Preferences();
 * preferences.projectName = "my-app";
 * preferences.orm = "Drizzle";
 * ```
 */
export class Preferences {
  // 项目基本信息
  projectName = "";
  dir = "";
  packageManager: PackageManager = "bun";
  runtime: "Bun" | "Node.js" = "Bun";

  // 代码质量工具
  linter: LinterType = "None";

  // 数据库配置
  orm: ORMType = "None";
  database: DatabaseType = "PostgreSQL";
  driver: DrizzleDriver = "None";

  // Git 配置
  git = true;

  // 集成工具
  others: IntegrationTool[] = [];

  // Elysia 插件
  plugins: ElysiaPlugin[] = [];

  // 单仓库模式
  isMonorepo = false;

  // 开发工具
  docker = false;
  vscode = false;

  // 服务配置
  redis = false;
  locks = false;
  s3Client: S3ClientType = "None";

  // 元数据（自动生成）
  meta: {
    databasePassword: string;
  } = {
    databasePassword: randomBytes(12).toString("hex"),
  };

  // 安装配置
  noInstall = false;

  // 测试配置
  mockWithPGLite = false;

  // Telegram 集成
  telegramRelated = false;

  // Husky (Git hooks)
  husky = false;

  // 格式化工具
  formatter: "ultracite" | "biome" | "eslint" | "none" = "ultracite";

  // Pro 专业版模板专属
  clusterEnabled = false;
  withMenu = false;
}

/**
 * Preferences 类的实例类型
 */
export type PreferencesType = InstanceType<typeof Preferences>;
