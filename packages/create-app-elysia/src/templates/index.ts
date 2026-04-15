/**
 * Templates 层统一导出
 * 第三层：模板与生成层
 * 
 * 目录结构：
 * - base/     基础配置 (package.json, tsconfig.json 等)
 * - core/     核心代码 (server.ts, index.ts, config.ts)
 * - db/       数据库相关 (Prisma, Drizzle)
 * - services/ 服务层 (Redis, S3, Posthog 等)
 * - dev/      开发工具 (ESLint, Docker, VSCode)
 * - tests/    测试相关
 */

// 基础配置
export { getPackageJson } from "./base/package-json";
export { getTSConfig } from "./base/tsconfig";
export { getGitIgnore } from "./base/gitignore";
export { getReadme } from "./base/readme";

// 核心代码
export { getElysiaIndex } from "./core/server";
export { getIndex } from "./core/index";
export { getConfigFile } from "./core/config";

// 数据库
export { getDBIndex } from "./db/index";
export { getDrizzleConfig } from "./db/drizzle";

// 开发工具
export { generateEslintConfig } from "./dev/eslint";
export { getDockerfile, getDockerCompose, getDevelopmentDockerCompose } from "./dev/docker";
export { getVSCodeExtensions, getVSCodeSettings } from "./dev/vscode";

// 服务层（保持原有位置）
export { getAuthPlugin } from "./services/auth";
export { getJobifyFile } from "./services/jobify";
export { getLocksFile } from "./services/locks";
export { getPosthogIndex } from "./services/posthog";
export { getRedisFile } from "./services/redis";
export { getS3ServiceFile } from "./services/s3";

// 测试
export { getPreloadFile, getTestsAPIFile, getTestsIndex, getTestSharedFile } from "./tests";

// 其他
export { getBotFile } from "./bot";
export { getInstallCommands } from "./install";
export { getEnvFile } from "./env";
