/**
 * 全局类型定义
 * 所有模块共享的类型和接口
 */

import type { Preferences } from "./utils/preferences";

// 包管理器类型
export type PackageManager = "bun" | "npm" | "yarn" | "pnpm";

// 数据库类型
export type DatabaseType =
  | "PostgreSQL"
  | "MySQL"
  | "MongoDB"
  | "SQLite"
  | "SQLServer"
  | "CockroachDB";

// Drizzle 驱动类型
export type DrizzleDriver =
  | "node-postgres"
  | "Bun.sql"
  | "Postgres.JS"
  | "MySQL 2"
  | "Bun SQLite"
  | "None";

// ORM 类型
export type ORMType = "Prisma" | "Drizzle" | "None";

// Linter 类型
export type LinterType = "ESLint" | "Biome" | "None";

// Elysia 插件类型
export type ElysiaPlugin =
  | "JWT"
  | "CORS"
  | "Swagger"
  | "Autoload"
  | "Oauth 2.0"
  | "Logger"
  | "HTML/JSX"
  | "Static"
  | "Bearer"
  | "Server Timing";

// 集成工具类型
export type IntegrationTool = "S3" | "Posthog" | "Jobify";

// S3 客户端类型
export type S3ClientType = "Bun.S3Client" | "@aws-sdk/client-s3" | "None";

// 用户偏好配置（简化版，用于 prompts 之间传递）
export interface PartialPreferences {
  isMonorepo?: boolean;
  orm?: ORMType;
  database?: DatabaseType;
  driver?: DrizzleDriver;
  plugins?: ElysiaPlugin[];
  others?: IntegrationTool[];
  s3Client?: S3ClientType;
  redis?: boolean;
  docker?: boolean;
  vscode?: boolean;
  linter?: LinterType;
  git?: boolean;
  locks?: boolean;
  telegramRelated?: boolean;
  mockWithPGLite?: boolean;
  husky?: boolean;
  formatter?: "ultracite" | "biome" | "eslint" | "none";
  clusterEnabled?: boolean;
  withMenu?: boolean;
}

// 完整的 Preferences 类型引用
export type { Preferences };
export type PreferencesType = Preferences;
