/**
 * 包管理器工具函数
 * 检测包管理器并提供相关命令映射
 */

import type { PackageManager } from "../types";

/**
 * 检测当前使用的包管理器
 * @returns 包管理器名称
 */
export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;

  if (!userAgent) {
    throw new Error(
      `Package manager was not detected. Please specify template with "--pm bun"`
    );
  }

  return userAgent.split(" ")[0].split("/")[0] as PackageManager;
}

/**
 * 包管理器执行命令映射（用于 npx/yarn dlx 等）
 */
export const pmExecuteMap: Record<PackageManager, string> = {
  npm: "npx",
  bun: "bun x",
  yarn: "yarn dlx",
  pnpm: "pnpm dlx",
};

/**
 * 包管理器运行脚本映射（用于 npm run/yarn 等）
 */
export const pmRunMap: Record<PackageManager, string> = {
  npm: "npm run",
  bun: "bun",
  yarn: "yarn",
  pnpm: "pnpm",
};

/**
 * 包管理器单仓库过滤命令映射
 */
export const pmFilterMonorepoMap: Record<PackageManager, string | false> = {
  npm: false,
  yarn: false,
  bun: "bun --filter 'apps/*'",
  pnpm: "pnpm --filter 'apps/*'",
};

/**
 * 包管理器锁文件映射
 */
export const pmLockFilesMap: Record<PackageManager, string> = {
  npm: "package.lock.json",
  bun: "bun.lock",
  yarn: "yarn.lock",
  pnpm: "pnpm-lock.yaml",
};

/**
 * 包管理器冻结锁文件安装命令（开发环境）
 */
export const pmInstallFrozenLockfile: Record<PackageManager, string> = {
  npm: "npm ci",
  bun: "bun install --frozen-lockfile",
  yarn: "yarn install --frozen-lockfile",
  pnpm: "pnpm install --frozen-lockfile",
};

/**
 * 包管理器冻结锁文件安装命令（生产环境）
 */
export const pmInstallFrozenLockfileProduction: Record<PackageManager, string> =
  {
    npm: "npm ci --production",
    bun: "bun install --frozen-lockfile --production",
    yarn: "yarn install --frozen-lockfile --production",
    pnpm: "pnpm install --frozen-lockfile --prod",
};

/**
 * 获取包管理器的安装命令
 * @param packageManager 包管理器
 * @param packages 要安装的包列表
 */
export function getInstallCommand(
  packageManager: PackageManager,
  packages: string[],
  dev = false
): string {
  const devFlag = {
    npm: "--save-dev",
    bun: "--dev",
    yarn: "--dev",
    pnpm: "--save-dev",
  }[packageManager];

  const installCmd = {
    npm: "install",
    bun: "add",
    yarn: "add",
    pnpm: "add",
  }[packageManager];

  return `${packageManager} ${installCmd} ${dev ? devFlag : ""} ${packages.join(" ")}`;
}
