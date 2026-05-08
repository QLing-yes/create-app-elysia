/**
 * 体 - 统一导出
 * 体不包含任何 isMonorepo 判断
 */

// ========== 核心配置 ==========
export { getPackageJson } from "./core/package-json";
export { getTSConfig } from "./core/tsconfig";
export { getGitIgnore } from "./core/gitignore";
export { getReadme } from "./core/readme";

// ========== 源代码 ==========
export { getElysiaIndex } from "./source/server";
export { getIndex } from "./source/entry";
export { getConfigFile } from "./source/config";
export { getEnvFile } from "./source/env";

// ========== 数据库 ==========
export { getDBIndex, getDrizzleConfig } from "./db/index";

// ========== 服务层 ==========
export { getAuthPlugin } from "./services/auth";
export { getJobifyFile } from "./services/jobify";
export { getLocksFile } from "./services/locks";
export { getPosthogIndex } from "./services/posthog";
export { getRedisFile } from "./services/redis";
export { getS3ServiceFile } from "./services/s3";

// ========== 开发工具 ==========
export { generateEslintConfig } from "./dev-tools/eslint";
export { getDockerfile, getDockerCompose, getDevelopmentDockerCompose } from "./dev-tools/docker";
export { getVSCodeExtensions, getVSCodeSettings } from "./dev-tools/vscode";

// ========== 测试 ==========
export { getPreloadFile, getTestsAPIFile, getTestsIndex, getTestSharedFile } from "./tests/index";

// ========== 其他 ==========
export { getBotFile } from "./bot";
export { getInstallCommands } from "./install";
export { dependencies } from "./dependency";
